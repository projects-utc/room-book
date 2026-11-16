package vn.odauday.autotest.be;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.APIResponse;
import org.junit.jupiter.api.Test;
import vn.odauday.autotest.base.BasePlaywrightAutoTest;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class BeAuthApiAutoTest extends BasePlaywrightAutoTest {

    @Test
    void api_01_healthEndpointShouldReturnUp() {
        APIResponse res = getApi("/api/auth/health");
        assertEquals(200, res.status());
        JsonNode json = readJson(res);
        assertTrue(json.path("success").asBoolean());
        assertEquals("UP", json.path("data").path("status").asText());
    }

    @Test
    void api_02_loginSeededGuestHostAdminShouldReturnJwtAndRole() {
        assertLoginRole("guest.demo", "123", "GUEST");
        assertLoginRole("host.demo", "123", "HOST");
        assertLoginRole("admin", "123", "ADMIN");
    }

    @Test
    void api_03_loginLockedUserMinhPhamShouldReturn400() {
        APIResponse res = postJson("/api/auth/login", Map.of(
                "username", "minh.pham",
                "password", "123"
        ));
        assertEquals(400, res.status());
        String msg = readJson(res).path("message").asText().toLowerCase();
        assertTrue(msg.contains("khóa") || msg.contains("locked"), "Thong bao loi phai neu ro bi khoa");
    }

    @Test
    void api_04_loginWrongPasswordAndUnknownUserShouldReturn400() {
        APIResponse badPass = postJson("/api/auth/login", Map.of(
                "username", "guest.demo",
                "password", "wrong-pass"
        ));
        assertEquals(400, badPass.status());

        APIResponse unknown = postJson("/api/auth/login", Map.of(
                "username", "nonexistent_" + uniqueTag(),
                "password", "123"
        ));
        assertEquals(400, unknown.status());
    }

    @Test
    void api_05_registerNewGuestShouldReturn201AndMeEndpointShouldVerifyJwt() {
        String tag = uniqueTag();
        String username = "auto_guest_" + tag;
        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("username", username);
        payload.put("password", "Pass123!");
        payload.put("fullName", "Auto Guest " + tag);
        payload.put("phone", "0912000111");
        payload.put("email", username + "@odauday.vn");
        payload.put("role", "GUEST");

        APIResponse reg = postJson("/api/auth/register", payload);
        assertEquals(201, reg.status());
        JsonNode regJson = readJson(reg);
        String token = regJson.path("token").asText();
        assertFalse(token.isBlank());
        assertEquals(username, regJson.path("user").path("username").asText());

        APIResponse me = getApi("/api/auth/me", token);
        assertEquals(200, me.status());
        assertEquals(username, readJson(me).path("data").path("username").asText());

        APIResponse roleCheck = getApi("/api/auth/check-role", token);
        assertEquals(200, roleCheck.status());
        assertEquals("GUEST", readJson(roleCheck).path("data").path("role").asText());
    }

    @Test
    void api_06_registerDuplicateUsernameOrEmailShouldReturn400() {
        String tag = uniqueTag();
        APIResponse dupUser = postJson("/api/auth/register", Map.of(
                "username", "guest.demo",
                "password", "123",
                "fullName", "Dup User",
                "email", "dup_" + tag + "@odauday.vn"
        ));
        assertEquals(400, dupUser.status());

        APIResponse dupEmail = postJson("/api/auth/register", Map.of(
                "username", "dup_email_user_" + tag,
                "password", "123",
                "fullName", "Dup Email",
                "email", "nam.le@gmail.com"
        ));
        assertEquals(400, dupEmail.status());
    }

    @Test
    void api_07_registerBlankFieldsShouldTriggerValidation400() {
        APIResponse res = postJson("/api/auth/register", Map.of(
                "username", "",
                "password", "",
                "fullName", ""
        ));
        assertEquals(400, res.status());
        assertFalse(readJson(res).path("message").asText().isBlank());
    }

    @Test
    void api_08_meWithoutOrTamperedBearerTokenShouldReturn401() {
        APIResponse missing = getApi("/api/auth/me");
        assertEquals(401, missing.status());

        APIResponse tampered = getApi("/api/auth/me", "invalid.jwt.signature");
        assertEquals(401, tampered.status());
    }

    @Test
    void api_09_sqlInjectionInLoginShouldNotBypassAuthentication() {
        APIResponse sqli = postJson("/api/auth/login", Map.of(
                "username", "admin' OR '1'='1",
                "password", "123"
        ));
        assertEquals(400, sqli.status());
        assertFalse(readJson(sqli).hasNonNull("token"));
    }

    @Test
    void api_10_adminUserLifecycleCreateToggleLockAndChangeRoleShouldWork() {
        String adminToken = loginBearer("admin", "123");
        String tag = uniqueTag();
        String username = "auto_managed_" + tag;

        Map<String, String> createBody = new LinkedHashMap<>();
        createBody.put("username", username);
        createBody.put("password", "123");
        createBody.put("fullName", "Managed User " + tag);
        createBody.put("phone", "0909888777");
        createBody.put("email", username + "@odauday.vn");
        createBody.put("role", "GUEST");

        APIResponse created = postJson("/api/users", createBody, adminToken);
        assertEquals(201, created.status());
        long userId = readJson(created).path("data").path("id").asLong();
        assertTrue(userId > 0);

        String userToken = loginBearer(username, "123");
        assertEquals(200, getApi("/api/auth/me", userToken).status());

        APIResponse locked = patchJson("/api/users/" + userId + "/toggle-status", Map.of(), adminToken);
        assertEquals(200, locked.status());
        assertEquals("LOCKED", readJson(locked).path("data").path("status").asText());

        APIResponse loginAfterLock = postJson("/api/auth/login", Map.of(
                "username", username,
                "password", "123"
        ));
        assertEquals(400, loginAfterLock.status());

        APIResponse promoted = patchJson("/api/users/" + userId + "/role", Map.of("role", "HOST"), adminToken);
        assertEquals(200, promoted.status());
        assertEquals("HOST", readJson(promoted).path("data").path("role").asText());

        APIResponse unlocked = patchJson("/api/users/" + userId + "/toggle-status", Map.of(), adminToken);
        assertEquals(200, unlocked.status());
        assertEquals("ACTIVE", readJson(unlocked).path("data").path("status").asText());
    }

    private void assertLoginRole(String username, String password, String expectedRole) {
        APIResponse res = postJson("/api/auth/login", Map.of(
                "username", username,
                "password", password
        ));
        assertEquals(200, res.status());
        JsonNode json = readJson(res);
        assertFalse(json.path("token").asText().isBlank());
        assertEquals(expectedRole, json.path("user").path("role").asText());
    }
}
