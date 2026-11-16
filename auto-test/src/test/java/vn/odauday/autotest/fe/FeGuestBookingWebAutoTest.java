package vn.odauday.autotest.fe;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.APIResponse;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import org.junit.jupiter.api.Test;
import vn.odauday.autotest.base.BasePlaywrightAutoTest;

import java.net.URI;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class FeGuestBookingWebAutoTest extends BasePlaywrightAutoTest {

    @Override
    protected boolean requiresBrowser() {
        return true;
    }

    private String bookThroughQuoteUi(String[] dates) {
        String quoteUrl = String.format(
                "%s/booking-quote?propertyId=1&roomId=1&in=%s&out=%s&guests=2",
                feUrl(), dates[0], dates[1]
        );
        page.navigate(quoteUrl);
        page.waitForSelector("#name", new Page.WaitForSelectorOptions().setTimeout(20000));
        page.click("button:has-text('Xác nhận thanh toán')");

        page.waitForFunction(
                "() => window.location.pathname === '/booking-success' && document.body.innerText.includes('Thanh toán thành công!')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(20000)
        );

        String query = URI.create(page.url()).getQuery();
        for (String param : query.split("&")) {
            if (param.startsWith("code=")) {
                return param.substring("code=".length());
            }
        }
        throw new IllegalStateException("Khong tim thay ma don booking trong URL: " + page.url());
    }

    @Test
    void ui_06_homePageAndPropertyDetailShouldRenderBackendCatalog() {
        waitForFrontendReady();
        Locator targetCard = page.locator("article", new Page.LocatorOptions()
                .setHas(page.locator("img[alt='ODauDay Stay Hồ Tây']"))).first();
        targetCard.waitFor(new Locator.WaitForOptions().setTimeout(15000));
        assertTrue(targetCard.isVisible());

        targetCard.click();
        page.waitForFunction(
                "() => window.location.pathname.startsWith('/property/') && document.body.innerText.includes('Đặt phòng')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );
        assertTrue(page.locator("#reserve-guests").isVisible());
    }

    @Test
    void ui_07_heroSearchShouldNavigateAndFilterMatchingProperties() {
        waitForFrontendReady();
        page.fill("#hero-search-dest", "Hồ Tây");
        page.click("button[aria-label='Bắt đầu tìm kiếm']");

        page.waitForFunction(
                "() => window.location.pathname === '/search' && document.querySelectorAll(\"img[alt*='Hồ Tây']\").length > 0",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );
        assertTrue(page.url().contains("kw="));
    }

    @Test
    void ui_08_propertyDetailShouldBlockCapacityOverMaxWithToast() {
        waitForFrontendReady();
        String[] dates = uniqueFutureDates(2);
        page.navigate(String.format("%s/property/1?in=%s&out=%s&guests=2", feUrl(), dates[0], dates[1]));
        page.waitForSelector("#reserve-guests", new Page.WaitForSelectorOptions().setTimeout(15000));

        page.selectOption("#reserve-guests", "5");
        page.click("button:has-text('Đặt phòng')");

        page.waitForFunction(
                "() => document.body.innerText.includes('tối đa 2 khách')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(10000)
        );
        assertTrue(page.url().contains("/property/1"));
    }

    @Test
    void ui_09_e2eBookingPaymentFlowShouldCreateRealBackendBooking() {
        String guestToken = loginBearer("guest.demo", "123");
        loginViaUi("guest.demo", "123");

        String[] dates = uniqueFutureDates(2);
        String createdCode = bookThroughQuoteUi(dates);
        assertFalse(createdCode.isBlank());
        assertTrue(page.locator("body").innerText().contains(createdCode));

        APIResponse apiCheck = getApi("/api/bookings/" + createdCode, guestToken);
        assertEquals(200, apiCheck.status());
        JsonNode data = readJson(apiCheck).path("data");
        assertEquals("PENDING", data.path("status").asText());
        assertEquals(2, data.path("nights").asInt());

        postJson("/api/bookings/" + createdCode + "/cancel", Map.of(), guestToken);
    }

    @Test
    void ui_10_myBookingsTabsShouldFilterUpcomingAndCompletedTrips() {
        loginViaUi("guest.demo", "123");
        page.navigate(feUrl() + "/my-bookings");
        page.waitForFunction(
                "() => document.body.innerText.includes('Đơn đặt phòng của tôi')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(15000)
        );

        page.getByText("Đã hoàn thành").first().click();
        page.waitForFunction(
                "() => document.body.innerText.includes('ODD-DEMO-0001')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(10000)
        );

        page.getByText("Sắp tới & Chờ xác nhận").first().click();
        page.waitForFunction(
                "() => document.body.innerText.includes('ODD-DEMO-0002')",
                null,
                new Page.WaitForFunctionOptions().setTimeout(10000)
        );
    }

    @Test
    void ui_11_guestReviewCompletedBookingShouldPersistAndDisplayInReviews() {
        String adminToken = loginBearer("admin", "123");
        loginViaUi("guest.demo", "123");

        String[] dates = uniqueFutureDates(2);
        String code = bookThroughQuoteUi(dates);
        assertEquals(200, patchJson("/api/bookings/" + code + "/status", Map.of("status", "COMPLETED"), adminToken).status());

        String reviewText = "Playwright UI Review Clean Stay " + uniqueTag();
        page.navigate(feUrl() + "/review?bookingCode=" + code);
        page.waitForSelector("textarea", new Page.WaitForSelectorOptions().setTimeout(15000));
        page.fill("textarea", reviewText);
        page.click("button:has-text('Gửi đánh giá')");

        try {
            page.waitForFunction(
                    "(txt) => window.location.pathname === '/property/1' && document.body.innerText.includes(txt)",
                    reviewText,
                    new Page.WaitForFunctionOptions().setTimeout(15000)
            );
        } catch (RuntimeException e) {
            throw new AssertionError("Expected redirect to /property/1 with review text, but actual URL was: "
                    + page.url() + " | body snippet: " + page.locator("body").innerText().substring(0, Math.min(300, page.locator("body").innerText().length())), e);
        }

        postJson("/api/bookings/" + code + "/admin-cancel", Map.of("reason", "Cleanup E2E review test"), adminToken);
    }
}

