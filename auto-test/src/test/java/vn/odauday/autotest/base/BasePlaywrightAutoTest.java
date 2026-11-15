package vn.odauday.autotest.base;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.playwright.APIRequest;
import com.microsoft.playwright.APIRequestContext;
import com.microsoft.playwright.APIResponse;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.RequestOptions;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInstance;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class BasePlaywrightAutoTest {

    protected static final ObjectMapper JSON = new ObjectMapper();
    private static final AtomicInteger UNIQUE_SEQ = new AtomicInteger(1);
    private static final long RUN_DAY_OFFSET = ((System.currentTimeMillis() / 500L) % 4000L) * 25L;

    protected Playwright playwright;
    protected APIRequestContext api;
    protected Browser browser;
    protected BrowserContext context;
    protected Page page;

    protected boolean requiresBrowser() {
        return false;
    }

    protected static String beUrl() {
        return stripTrailingSlash(System.getProperty("beUrl", "http://localhost:8080"));
    }

    protected static String feUrl() {
        return stripTrailingSlash(System.getProperty("feUrl", "http://localhost:5173"));
    }

    protected static boolean isHeadless() {
        return Boolean.parseBoolean(System.getProperty("headless", "false"));
    }

    protected static double slowMoMs() {
        String raw = System.getProperty("slowMo");
        if (raw != null && !raw.isBlank()) {
            return Double.parseDouble(raw);
        }
        return isHeadless() ? 0 : 120;
    }

    private static String stripTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    @BeforeAll
    void initPlaywrightSuite() {
        playwright = Playwright.create();
        api = playwright.request().newContext(
                new APIRequest.NewContextOptions().setBaseURL(beUrl())
        );

        APIResponse health = api.get("/api/auth/health");
        assertEquals(200, health.status(),
                "Backend khong san sang tai " + beUrl() + "/api/auth/health");

        if (requiresBrowser()) {
            BrowserType.LaunchOptions options = new BrowserType.LaunchOptions()
                    .setHeadless(isHeadless())
                    .setSlowMo(slowMoMs());
            try {
                browser = playwright.chromium().launch(options.setChannel("chrome"));
            } catch (RuntimeException ignored) {
                browser = playwright.chromium().launch(
                        new BrowserType.LaunchOptions()
                                .setHeadless(isHeadless())
                                .setSlowMo(slowMoMs())
                );
            }
        }
    }

    @BeforeEach
    void initBrowserPage() {
        if (requiresBrowser() && browser != null) {
            context = browser.newContext(new Browser.NewContextOptions().setViewportSize(1440, 900));
            page = context.newPage();
            page.setDefaultTimeout(15000);
        }
    }

    @AfterEach
    void closeBrowserPage() {
        if (page != null) {
            page.close();
            page = null;
        }
        if (context != null) {
            context.close();
            context = null;
        }
    }

    @AfterAll
    void tearDownPlaywrightSuite() {
        if (browser != null) {
            browser.close();
        }
        if (api != null) {
            api.dispose();
        }
        if (playwright != null) {
            playwright.close();
        }
    }

    protected static String uniqueTag() {
        return Long.toString(System.currentTimeMillis() % 1_000_000L)
                + "_" + UNIQUE_SEQ.getAndIncrement();
    }

    protected static String[] uniqueFutureDates(int nights) {
        LocalDate base = LocalDate.of(2028, 1, 1)
                .plusDays(RUN_DAY_OFFSET + (UNIQUE_SEQ.getAndIncrement() * 5L));
        return new String[]{base.toString(), base.plusDays(nights).toString()};
    }

    protected APIResponse getApi(String path) {
        return api.get(path);
    }

    protected APIResponse getApi(String path, String bearerToken) {
        return api.get(path, RequestOptions.create()
                .setHeader("Authorization", "Bearer " + bearerToken));
    }

    protected APIResponse postJson(String path, Object body) {
        return api.post(path, jsonOptions(body, null));
    }

    protected APIResponse postJson(String path, Object body, String bearerToken) {
        return api.post(path, jsonOptions(body, bearerToken));
    }

    protected APIResponse patchJson(String path, Object body, String bearerToken) {
        return api.patch(path, jsonOptions(body, bearerToken));
    }

    protected APIResponse deleteApi(String path, String bearerToken) {
        RequestOptions opts = RequestOptions.create();
        if (bearerToken != null && !bearerToken.isBlank()) {
            opts.setHeader("Authorization", "Bearer " + bearerToken);
        }
        return api.delete(path, opts);
    }

    private RequestOptions jsonOptions(Object body, String bearerToken) {
        try {
            String json = JSON.writeValueAsString(body);
            RequestOptions opts = RequestOptions.create()
                    .setHeader("Content-Type", "application/json; charset=UTF-8")
                    .setData(json.getBytes(StandardCharsets.UTF_8));
            if (bearerToken != null && !bearerToken.isBlank()) {
                opts.setHeader("Authorization", "Bearer " + bearerToken);
            }
            return opts;
        } catch (Exception e) {
            throw new IllegalStateException("Khong the serialize JSON request", e);
        }
    }

    protected JsonNode readJson(APIResponse response) {
        try {
            return JSON.readTree(response.text());
        } catch (Exception e) {
            throw new IllegalStateException("Phan hoi khong phai JSON hop le: " + response.text(), e);
        }
    }

    protected String loginBearer(String username, String password) {
        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("username", username);
        payload.put("password", password);
        APIResponse res = postJson("/api/auth/login", payload);
        assertEquals(200, res.status(), "Dang nhap that bai cho " + username + ": " + res.text());
        JsonNode json = readJson(res);
        String token = json.path("token").asText();
        assertNotNull(token);
        assertFalse(token.isBlank(), "Token JWT khong duoc rong");
        return token;
    }

    protected void waitForFrontendReady() {
        page.navigate(feUrl() + "/");
        page.waitForFunction(
                "() => document.body && document.body.innerText.includes('ODauDay Stay')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(20000)
        );
    }

    protected void loginViaUi(String username, String password) {
        page.navigate(feUrl() + "/login");
        page.waitForSelector("#login-username");
        page.fill("#login-username", username);
        page.fill("#login-password", password);
        page.click("button.auth-submit-btn");
        page.waitForFunction(
                "() => window.location.pathname !== '/login'",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );
        assertTrue(page.url().startsWith(feUrl()), "Phai dieu huong khoi trang /login sau khi dang nhap");
    }
}
