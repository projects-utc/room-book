package vn.odauday.autotest.fe;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import org.junit.jupiter.api.Test;
import vn.odauday.autotest.base.BasePlaywrightAutoTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class FeAuthWebAutoTest extends BasePlaywrightAutoTest {

    @Override
    protected boolean requiresBrowser() {
        return true;
    }

    @Test
    void ui_01_loginGuestAndLogoutModalShouldWork() {
        loginViaUi("guest.demo", "123");

        page.click(".user-avatar-btn");
        Locator dropdown = page.locator(".user-dropdown");
        dropdown.waitFor();
        String dropdownText = dropdown.innerText();
        assertTrue(dropdownText.contains("@guest.demo"));
        assertTrue(dropdownText.contains("Đơn đặt phòng sắp tới"));

        dropdown.locator("button:has-text('Đăng xuất')").click();
        page.locator(".logout-modal-box").waitFor();
        page.click(".btn-confirm-logout");

        page.waitForFunction(
                "() => window.location.pathname === '/'",
                null,
                new Page.WaitForFunctionOptions().setTimeout(10000)
        );

        page.click(".user-avatar-btn");
        page.locator(".user-dropdown").waitFor();
        assertTrue(page.locator(".user-dropdown").innerText().contains("Đăng nhập"));
    }

    @Test
    void ui_02_loginInvalidOrLockedShouldRemainUnauthenticatedWithoutForgotLink() {
        page.navigate(feUrl() + "/login");
        page.waitForSelector("#login-username", new Page.WaitForSelectorOptions().setTimeout(20000));

        assertFalse(page.content().contains("Quên mật khẩu"),
                "Trang dang nhap khong duoc hien lien ket Quen mat khau");

        page.fill("#login-username", "guest.demo");
        page.fill("#login-password", "wrong-password");
        page.click("button.auth-submit-btn");
        page.waitForTimeout(800);
        assertTrue(page.url().contains("/login"));
        assertEquals(Boolean.FALSE, page.evaluate("() => Boolean(localStorage.getItem('odd_jwt_token'))"));

        page.reload();
        page.waitForSelector("#login-username", new Page.WaitForSelectorOptions().setTimeout(20000));
        page.fill("#login-username", "minh.pham");
        page.fill("#login-password", "123");
        page.click("button.auth-submit-btn");
        page.waitForTimeout(800);
        assertTrue(page.url().contains("/login"));
        assertEquals(Boolean.FALSE, page.evaluate("() => Boolean(localStorage.getItem('odd_jwt_token'))"));
    }

    @Test
    void ui_03_registerNewGuestAccountViaUiShouldRedirectToLoginAndSignIn() {
        String tag = uniqueTag();
        String username = "uigu_" + tag;

        page.navigate(feUrl() + "/register");
        page.waitForSelector("#reg-fullname", new Page.WaitForSelectorOptions().setTimeout(20000));

        page.fill("#reg-fullname", "UI Guest " + tag);
        page.fill("#reg-username", username);
        page.fill("#reg-password", "Pass123!");
        page.fill("#reg-phone", "0912334455");
        page.fill("#reg-email", username + "@odauday.vn");
        page.click("button.auth-submit-btn");

        page.waitForFunction(
                "() => window.location.pathname === '/login'",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );

        loginViaUi(username, "Pass123!");
        page.click(".user-avatar-btn");
        page.locator(".user-dropdown").waitFor();
        assertTrue(page.locator(".user-dropdown").innerText().contains("@" + username));
    }

    @Test
    void ui_04_rbacProtectedRoutesShouldRedirectUnauthorizedUsers() {
        waitForFrontendReady();

        page.navigate(feUrl() + "/admin");
        page.waitForFunction(
                "() => window.location.pathname === '/login'",
                null,
                new Page.WaitForFunctionOptions().setTimeout(10000)
        );

        page.navigate(feUrl() + "/host/properties");
        page.waitForFunction(
                "() => window.location.pathname === '/login'",
                null,
                new Page.WaitForFunctionOptions().setTimeout(10000)
        );

        loginViaUi("guest.demo", "123");
        page.navigate(feUrl() + "/admin");
        page.waitForFunction(
                "() => window.location.pathname === '/client'",
                null,
                new Page.WaitForFunctionOptions().setTimeout(10000)
        );

        page.navigate(feUrl() + "/host/properties");
        page.waitForFunction(
                "() => window.location.pathname === '/client'",
                null,
                new Page.WaitForFunctionOptions().setTimeout(10000)
        );
    }

    @Test
    void ui_05_hostSessionShouldPersistAcrossPageReload() {
        loginViaUi("host.demo", "123");
        page.navigate(feUrl() + "/host/properties");
        page.waitForFunction(
                "() => document.body.innerText.includes('Thêm chỗ ở mới')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );

        page.reload();
        page.waitForFunction(
                "() => window.location.pathname === '/host/properties' && document.body.innerText.includes('Thêm chỗ ở mới')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );
    }
}

