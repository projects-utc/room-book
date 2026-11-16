package vn.odauday.autotest.be;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.APIResponse;
import org.junit.jupiter.api.Test;
import vn.odauday.autotest.base.BasePlaywrightAutoTest;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class BeBookingApiAutoTest extends BasePlaywrightAutoTest {

    private Map<String, Object> buildBookingPayload(String code, long roomId, String checkIn, String checkOut) {
        Map<String, Object> payload = new LinkedHashMap<>();
        if (code != null) {
            payload.put("code", code);
        }
        payload.put("guestUsername", "guest.demo");
        payload.put("guestName", "Nguyen Khach Test");
        payload.put("guestPhone", "0900000003");
        payload.put("guestEmail", "guest@odauday.vn");
        payload.put("propertyId", 1L);
        payload.put("propertyName", "ODauDay Stay Hồ Tây");
        payload.put("roomId", roomId);
        payload.put("roomName", "Phòng Garden View Tầng 1");
        payload.put("checkIn", checkIn);
        payload.put("checkOut", checkOut);
        payload.put("guests", 2);
        payload.put("pricePerNight", 650000.0);
        payload.put("serviceFee", 0.0);
        payload.put("paymentMethod", "BANK_TRANSFER");
        return payload;
    }

    @Test
    void api_18_listBookingsAndFilterByGuestShouldWork() {
        APIResponse allRes = getApi("/api/bookings");
        assertEquals(200, allRes.status());
        assertTrue(readJson(allRes).path("data").isArray());

        APIResponse guestRes = getApi("/api/bookings?guestUsername=guest.demo");
        assertEquals(200, guestRes.status());
        JsonNode data = readJson(guestRes).path("data");
        assertTrue(data.isArray() && !data.isEmpty());
        for (JsonNode b : data) {
            assertEquals("guest.demo", b.path("guestUsername").asText());
        }
    }

    @Test
    void api_19_getBookingByCodeValidAndUnknownShouldReturn200And400() {
        APIResponse ok = getApi("/api/bookings/ODD-DEMO-0001");
        assertEquals(200, ok.status());
        assertEquals("ODD-DEMO-0001", readJson(ok).path("data").path("code").asText());

        APIResponse missing = getApi("/api/bookings/ODD-MISSING-" + uniqueTag());
        assertEquals(400, missing.status());
    }

    @Test
    void api_20_createBookingShouldCalculateNightsAndTotalServerSide() {
        String token = loginBearer("guest.demo", "123");
        String[] dates = uniqueFutureDates(3);
        String code = "AUTO-BK-" + uniqueTag();

        APIResponse res = postJson("/api/bookings", buildBookingPayload(code, 1L, dates[0], dates[1]), token);
        assertEquals(201, res.status());
        JsonNode booking = readJson(res).path("data");
        assertEquals(code, booking.path("code").asText());
        assertEquals(3, booking.path("nights").asInt());
        assertEquals(1950000.0, booking.path("total").asDouble(), 0.01);
        assertEquals("PENDING", booking.path("status").asText());

        assertEquals(200, postJson("/api/bookings/" + code + "/cancel", Map.of(), token).status());
    }

    @Test
    void api_21_createAdjacentCheckInOnSameCheckoutDayShouldSucceed() {
        String token = loginBearer("guest.demo", "123");
        String[] dates = uniqueFutureDates(2);
        String midDate = dates[1];
        String endDate = LocalDate.parse(midDate).plusDays(2).toString();
        String code1 = "AUTO-ADJ1-" + uniqueTag();
        String code2 = "AUTO-ADJ2-" + uniqueTag();

        APIResponse r1 = postJson("/api/bookings", buildBookingPayload(code1, 1L, dates[0], midDate), token);
        assertEquals(201, r1.status());

        APIResponse r2 = postJson("/api/bookings", buildBookingPayload(code2, 1L, midDate, endDate), token);
        assertEquals(201, r2.status());

        postJson("/api/bookings/" + code1 + "/cancel", Map.of(), token);
        postJson("/api/bookings/" + code2 + "/cancel", Map.of(), token);
    }

    @Test
    void api_22_overlappingBookingShouldFailBR02UntilFirstBookingIsCancelled() {
        String token = loginBearer("guest.demo", "123");
        String[] base = uniqueFutureDates(3);
        String overlapStart = LocalDate.parse(base[0]).plusDays(1).toString();
        String overlapEnd = LocalDate.parse(base[1]).plusDays(1).toString();
        String code1 = "AUTO-OV1-" + uniqueTag();
        String code2 = "AUTO-OV2-" + uniqueTag();

        assertEquals(201, postJson("/api/bookings", buildBookingPayload(code1, 1L, base[0], base[1]), token).status());

        APIResponse blocked = postJson("/api/bookings", buildBookingPayload(code2, 1L, overlapStart, overlapEnd), token);
        assertEquals(400, blocked.status());

        assertEquals(200, postJson("/api/bookings/" + code1 + "/cancel", Map.of(), token).status());

        APIResponse unblocked = postJson("/api/bookings", buildBookingPayload(code2, 1L, overlapStart, overlapEnd), token);
        assertEquals(201, unblocked.status());
        postJson("/api/bookings/" + code2 + "/cancel", Map.of(), token);
    }

    @Test
    void api_23_createBookingInvalidBoundariesShouldReturn400() {
        String[] dates = uniqueFutureDates(2);

        Map<String, Object> badDates = buildBookingPayload("AUTO-BAD1-" + uniqueTag(), 1L, dates[1], dates[0]);
        assertEquals(400, postJson("/api/bookings", badDates).status());

        Map<String, Object> sameDates = buildBookingPayload("AUTO-BAD2-" + uniqueTag(), 1L, dates[0], dates[0]);
        assertEquals(400, postJson("/api/bookings", sameDates).status());

        Map<String, Object> badFormat = buildBookingPayload("AUTO-BAD3-" + uniqueTag(), 1L, "2028/05/01", dates[1]);
        assertEquals(400, postJson("/api/bookings", badFormat).status());

        Map<String, Object> zeroGuests = buildBookingPayload("AUTO-BAD4-" + uniqueTag(), 1L, dates[0], dates[1]);
        zeroGuests.put("guests", 0);
        assertEquals(400, postJson("/api/bookings", zeroGuests).status());

        Map<String, Object> negPrice = buildBookingPayload("AUTO-BAD5-" + uniqueTag(), 1L, dates[0], dates[1]);
        negPrice.put("pricePerNight", -100.0);
        assertEquals(400, postJson("/api/bookings", negPrice).status());

        Map<String, Object> missingGuest = buildBookingPayload("AUTO-BAD6-" + uniqueTag(), 1L, dates[0], dates[1]);
        missingGuest.put("guestUsername", "");
        assertEquals(400, postJson("/api/bookings", missingGuest).status());
    }

    @Test
    void api_24_bookingStatusLifecycleShouldTransitionPendingConfirmedCheckedInCompleted() {
        String hostToken = loginBearer("host.demo", "123");
        String adminToken = loginBearer("admin", "123");
        String[] dates = uniqueFutureDates(2);
        String code = "AUTO-FLOW-" + uniqueTag();

        assertEquals(201, postJson("/api/bookings", buildBookingPayload(code, 1L, dates[0], dates[1]), hostToken).status());

        for (String status : new String[]{"CONFIRMED", "CHECKED_IN", "COMPLETED"}) {
            APIResponse patch = patchJson("/api/bookings/" + code + "/status", Map.of("status", status), hostToken);
            assertEquals(200, patch.status());
            assertEquals(status, readJson(patch).path("data").path("status").asText());
        }

        postJson("/api/bookings/" + code + "/admin-cancel", Map.of("reason", "Cleanup test booking"), adminToken);
    }

    @Test
    void api_25_guestCancelShouldSucceedOnceAndRejectRepeatCancel400() {
        String token = loginBearer("guest.demo", "123");
        String[] dates = uniqueFutureDates(2);
        String code = "AUTO-CAN-" + uniqueTag();

        assertEquals(201, postJson("/api/bookings", buildBookingPayload(code, 1L, dates[0], dates[1]), token).status());

        APIResponse firstCancel = postJson("/api/bookings/" + code + "/cancel", Map.of(), token);
        assertEquals(200, firstCancel.status());
        assertEquals("CANCELLED", readJson(firstCancel).path("data").path("status").asText());

        APIResponse secondCancel = postJson("/api/bookings/" + code + "/cancel", Map.of(), token);
        assertEquals(400, secondCancel.status());
    }

    @Test
    void api_26_guestCannotCancelAlreadyCompletedBooking() {
        APIResponse res = postJson("/api/bookings/ODD-DEMO-0001/cancel", Map.of());
        assertEquals(400, res.status());
    }

    @Test
    void api_27_adminCancelShouldCancelAndCreateAuditLogEntry() {
        String adminToken = loginBearer("admin", "123");
        String[] dates = uniqueFutureDates(2);
        String code = "AUTO-ADM-" + uniqueTag();

        assertEquals(201, postJson("/api/bookings", buildBookingPayload(code, 1L, dates[0], dates[1]), adminToken).status());

        APIResponse adminCancel = postJson(
                "/api/bookings/" + code + "/admin-cancel",
                Map.of("reason", "Vi pham noi quy"),
                adminToken
        );
        assertEquals(200, adminCancel.status());
        assertEquals("CANCELLED", readJson(adminCancel).path("data").path("status").asText());

        APIResponse logsRes = getApi("/api/audit-logs", adminToken);
        assertEquals(200, logsRes.status());
        boolean foundAudit = false;
        for (JsonNode entry : readJson(logsRes).path("data")) {
            if (code.equals(entry.path("target").asText())) {
                foundAudit = true;
                break;
            }
        }
        assertTrue(foundAudit, "Nhat ky audit phai ghi nhan hanh dong admin-cancel cho " + code);
    }

    @Test
    void api_28_xssPayloadInBookingShouldReturnSafeJsonContentType() {
        String token = loginBearer("guest.demo", "123");
        String[] dates = uniqueFutureDates(2);
        String code = "AUTO-XSS-" + uniqueTag();
        Map<String, Object> body = buildBookingPayload(code, 1L, dates[0], dates[1]);
        body.put("guestName", "<script>alert(1)</script>");

        APIResponse res = postJson("/api/bookings", body, token);
        assertEquals(201, res.status());
        String contentType = res.headers().getOrDefault("content-type", "");
        assertFalse(contentType.contains("text/html"));

        postJson("/api/bookings/" + code + "/cancel", Map.of(), token);
    }
}

