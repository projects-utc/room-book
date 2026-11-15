package vn.odauday.autotest.be;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.APIResponse;
import org.junit.jupiter.api.Test;
import vn.odauday.autotest.base.BasePlaywrightAutoTest;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class BeReviewPromoRevenueApiAutoTest extends BasePlaywrightAutoTest {

    private String createTempBooking(String prefix, String token) {
        String[] dates = uniqueFutureDates(2);
        String code = prefix + "-" + uniqueTag();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", code);
        body.put("guestUsername", "guest.demo");
        body.put("guestName", "Nguyen Khach Test");
        body.put("propertyId", 1L);
        body.put("propertyName", "ODauDay Stay Hồ Tây");
        body.put("roomId", 1L);
        body.put("roomName", "Phòng Garden View Tầng 1");
        body.put("checkIn", dates[0]);
        body.put("checkOut", dates[1]);
        body.put("guests", 2);
        body.put("pricePerNight", 650000.0);
        body.put("serviceFee", 0.0);
        body.put("paymentMethod", "BANK_TRANSFER");
        APIResponse created = postJson("/api/bookings", body, token);
        assertEquals(201, created.status());
        return code;
    }

    @Test
    void api_29_createReviewBeforeBookingCompletedShouldReturn400() {
        String guestToken = loginBearer("guest.demo", "123");
        String code = createTempBooking("AUTO-REV-PEND", guestToken);

        APIResponse revRes = postJson("/api/reviews", Map.of(
                "bookingCode", code,
                "propertyId", 1L,
                "rating", 5,
                "comment", "Trying to review before checkout"
        ), guestToken);
        assertEquals(400, revRes.status());

        postJson("/api/bookings/" + code + "/cancel", Map.of(), guestToken);
    }

    @Test
    void api_30_createReviewForCompletedBookingShouldSucceedOnceAndRejectDuplicate() {
        String guestToken = loginBearer("guest.demo", "123");
        String adminToken = loginBearer("admin", "123");
        String code = createTempBooking("AUTO-REV-OK", guestToken);

        assertEquals(200, patchJson("/api/bookings/" + code + "/status", Map.of("status", "COMPLETED"), adminToken).status());

        APIResponse revRes = postJson("/api/reviews", Map.of(
                "bookingCode", code,
                "propertyId", 1L,
                "rating", 5,
                "comment", "Phong sach se va chu nha than thien"
        ), guestToken);
        assertEquals(201, revRes.status());
        assertEquals(5, readJson(revRes).path("data").path("rating").asInt());

        APIResponse dupRes = postJson("/api/reviews", Map.of(
                "bookingCode", code,
                "propertyId", 1L,
                "rating", 4,
                "comment", "Duplicate review should fail"
        ), guestToken);
        assertEquals(400, dupRes.status());

        postJson("/api/bookings/" + code + "/admin-cancel", Map.of("reason", "Cleanup review test"), adminToken);
    }

    @Test
    void api_31_createReviewOutOfRangeRatingShouldReturn400() {
        String guestToken = loginBearer("guest.demo", "123");
        APIResponse low = postJson("/api/reviews", Map.of(
                "bookingCode", "ODD-DEMO-0001",
                "propertyId", 1L,
                "rating", 0,
                "comment", "Invalid zero stars"
        ), guestToken);
        assertEquals(400, low.status());

        APIResponse high = postJson("/api/reviews", Map.of(
                "bookingCode", "ODD-DEMO-0001",
                "propertyId", 1L,
                "rating", 6,
                "comment", "Invalid six stars"
        ), guestToken);
        assertEquals(400, high.status());
    }

    @Test
    void api_32_applyPromotionShouldComputePercentCapAndFixedDiscount() {
        APIResponse cappedRes = postJson("/api/promotions/apply", Map.of(
                "code", "ODAUDAY10",
                "orderAmount", 3000000.0
        ));
        assertEquals(200, cappedRes.status());
        JsonNode capped = readJson(cappedRes).path("data");
        assertEquals(200000.0, capped.path("discountAmount").asDouble(), 0.01);
        assertEquals(2800000.0, capped.path("finalAmount").asDouble(), 0.01);

        APIResponse fixedRes = postJson("/api/promotions/apply", Map.of(
                "code", "WELCOME50K",
                "orderAmount", 500000.0
        ));
        assertEquals(200, fixedRes.status());
        JsonNode fixed = readJson(fixedRes).path("data");
        assertEquals(50000.0, fixed.path("discountAmount").asDouble(), 0.01);
        assertEquals(450000.0, fixed.path("finalAmount").asDouble(), 0.01);
    }

    @Test
    void api_33_applyInactiveExhaustedOrBelowMinOrderPromoShouldReturn400() {
        APIResponse inactive = postJson("/api/promotions/apply", Map.of(
                "code", "VIPTRAVEL",
                "orderAmount", 2000000.0
        ));
        assertEquals(400, inactive.status());

        APIResponse belowMin = postJson("/api/promotions/apply", Map.of(
                "code", "ODAUDAY10",
                "orderAmount", 400000.0
        ));
        assertEquals(400, belowMin.status());

        APIResponse missing = postJson("/api/promotions/apply", Map.of(
                "code", "NOPE_" + uniqueTag(),
                "orderAmount", 1000000.0
        ));
        assertEquals(400, missing.status());
    }

    @Test
    void api_34_promotionCreateToggleApplyAndDeleteLifecycleShouldCleanUp() {
        String adminToken = loginBearer("admin", "123");
        String code = "AUTO_PR_" + uniqueTag();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", code);
        body.put("type", "PERCENT");
        body.put("value", 20.0);
        body.put("maxDiscount", 300000.0);
        body.put("minOrder", 500000.0);
        body.put("usageLimit", 50);
        body.put("validFrom", "2026-01-01");
        body.put("validTo", "2028-12-31");
        body.put("status", "ACTIVE");

        APIResponse created = postJson("/api/promotions", body, adminToken);
        assertEquals(201, created.status());
        long promoId = readJson(created).path("data").path("id").asLong();
        assertTrue(promoId > 0);

        assertEquals(200, postJson("/api/promotions/apply", Map.of("code", code, "orderAmount", 1000000.0)).status());

        APIResponse toggled = patchJson("/api/promotions/" + promoId + "/toggle", Map.of(), adminToken);
        assertEquals(200, toggled.status());
        assertEquals("INACTIVE", readJson(toggled).path("data").path("status").asText());
        assertEquals(400, postJson("/api/promotions/apply", Map.of("code", code, "orderAmount", 1000000.0)).status());

        assertEquals(200, deleteApi("/api/promotions/" + promoId, adminToken).status());
    }

    @Test
    void api_35_revenueSummaryByOwnerShouldReflectCompletedBookingDelta() {
        String hostToken = loginBearer("host.demo", "123");
        String adminToken = loginBearer("admin", "123");

        APIResponse beforeRes = getApi("/api/bookings/revenue?owner=host.demo", hostToken);
        assertEquals(200, beforeRes.status());
        double revBefore = readJson(beforeRes).path("data").path("totalRevenue").asDouble();
        int countBefore = readJson(beforeRes).path("data").path("count").asInt();

        String code = createTempBooking("AUTO-REV-SUM", hostToken);
        assertEquals(200, patchJson("/api/bookings/" + code + "/status", Map.of("status", "COMPLETED"), hostToken).status());

        APIResponse afterRes = getApi("/api/bookings/revenue?owner=host.demo", hostToken);
        assertEquals(200, afterRes.status());
        double revAfter = readJson(afterRes).path("data").path("totalRevenue").asDouble();
        int countAfter = readJson(afterRes).path("data").path("count").asInt();

        assertEquals(countBefore + 1, countAfter);
        assertEquals(revBefore + 1300000.0, revAfter, 0.01);

        postJson("/api/bookings/" + code + "/admin-cancel", Map.of("reason", "Restore revenue baseline"), adminToken);
    }
}

