package vn.odauday.autotest.fe;

import com.microsoft.playwright.APIResponse;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import org.junit.jupiter.api.Test;
import vn.odauday.autotest.base.BasePlaywrightAutoTest;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class FeHostAdminPortalWebAutoTest extends BasePlaywrightAutoTest {

    @Override
    protected boolean requiresBrowser() {
        return true;
    }

    @Test
    void ui_12_hostPortalPagesPropertiesRoomsBlocksAndRevenueShouldRender() {
        loginViaUi("host.demo", "123");

        page.navigate(feUrl() + "/host/properties");
        page.waitForFunction(
                "() => document.body.innerText.includes('Thêm chỗ ở mới')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );

        page.navigate(feUrl() + "/host/rooms");
        page.waitForFunction(
                "() => document.body.innerText.includes('Danh sách phòng')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );

        page.navigate(feUrl() + "/host/roomblock");
        page.waitForSelector("#block-reason", new Page.WaitForSelectorOptions().setTimeout(15000));

        page.navigate(feUrl() + "/host/revenue");
        page.waitForFunction(
                "() => {" +
                        "const t = document.body.innerText.toLowerCase();" +
                        "return t.includes('báo cáo doanh thu')" +
                        " && t.includes('phí nền tảng phải trả')" +
                        " && t.includes('15%')" +
                        " && t.includes('195.000')" +
                        " && t.includes('1.105.000')" +
                        " && t.includes('doanh thu thực nhận');" +
                        "}",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );
    }

    @Test
    void ui_13_hostApproveBookingFromHostBookingsUiShouldPersistConfirmedStatus() {
        String guestToken = loginBearer("guest.demo", "123");
        String[] dates = uniqueFutureDates(2);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("guestName", "UI Host Approval Guest");
        body.put("guestPhone", "0900000003");
        body.put("propertyId", 1L);
        body.put("roomId", 1L);
        body.put("checkIn", dates[0]);
        body.put("checkOut", dates[1]);
        body.put("guests", 2);
        body.put("paymentMethod", "BANK_TRANSFER");
        APIResponse created = postJson("/api/bookings", body, guestToken);
        assertEquals(201, created.status(), created.text());
        String code = readJson(created).path("data").path("code").asText();

        loginViaUi("host.demo", "123");
        page.waitForFunction(
                "() => window.location.pathname === '/host/bookings' && document.body.innerText.toUpperCase().includes('NGÀY TẠO')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );
        page.waitForSelector("#booking-search", new Page.WaitForSelectorOptions().setTimeout(15000));
        page.fill("#booking-search", code);
        Locator row = page.locator("tr", new Page.LocatorOptions().setHasText(code));
        row.waitFor(new Locator.WaitForOptions().setTimeout(15000));

        row.locator("button:has-text('Duyệt đơn')").click();
        row.locator(".badge:has-text('Đã xác nhận')").waitFor(new Locator.WaitForOptions().setTimeout(10000));

        APIResponse updated = getApi("/api/bookings/" + code, guestToken);
        assertEquals(200, updated.status());
        assertEquals("CONFIRMED", readJson(updated).path("data").path("status").asText());

        postJson("/api/bookings/" + code + "/cancel", Map.of(), guestToken);
    }

    @Test
    void ui_14_adminDashboardUsersAndPromotionsShouldWorkEndToEnd() {
        loginViaUi("admin", "123");

        page.navigate(feUrl() + "/admin");
        page.waitForFunction(
                "() => document.body.innerText.includes('TRUNG TÂM ĐIỀU HÀNH')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );

        page.navigate(feUrl() + "/admin/users");
        page.waitForSelector("#user-kw", new Page.WaitForSelectorOptions().setTimeout(15000));
        page.fill("#user-kw", "linh.tran");
        page.waitForFunction(
                "() => document.body.innerText.includes('linh.tran')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(10000)
        );

        page.navigate(feUrl() + "/admin/promotions");
        page.waitForFunction(
                "() => document.body.innerText.includes('ODAUDAY10')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );

        String promoCode = "UIVOUCHER" + uniqueTag().replace("_", "");
        page.click("button:has-text('Tạo mã giảm giá mới')");
        page.locator("input[placeholder='VD: HE2027, CHAOHE15']").fill(promoCode);
        page.click("button:has-text('Xác nhận tạo mã')");

        page.waitForFunction(
                "(c) => document.body.innerText.includes(c)",
                promoCode,
                new Page.WaitForFunctionOptions().setTimeout(10000)
        );
    }

    @Test
    void ui_15_adminAuditLogsPageShouldSearchAndDisplayEvents() {
        loginViaUi("admin", "123");
        page.navigate(feUrl() + "/admin/audit-logs");
        page.waitForFunction(
                "() => document.body.innerText.includes('Nhật ký Hoạt động')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );

        Locator searchBox = page.locator("input[placeholder*='Tìm theo người thực hiện']");
        searchBox.fill("admin");
        assertTrue(page.locator("body").innerText().contains("admin"));
    }
}

