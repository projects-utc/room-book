package vn.odauday.autotest.be;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.APIResponse;
import org.junit.jupiter.api.Test;
import vn.odauday.autotest.base.BasePlaywrightAutoTest;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class BeBookingApiAutoTest extends BasePlaywrightAutoTest {

    /** Payload hợp lệ: chỉ các trường client được phép gửi. Mã đơn, người đặt, giá do server quyết định. */
    private Map<String, Object> buildBookingPayload(long roomId, String checkIn, String checkOut) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("guestName", "Nguyen Khach Test");
        payload.put("guestPhone", "0900000003");
        payload.put("guestEmail", "guest@odauday.vn");
        payload.put("propertyId", 1L);
        payload.put("roomId", roomId);
        payload.put("checkIn", checkIn);
        payload.put("checkOut", checkOut);
        payload.put("guests", 2);
        payload.put("paymentMethod", "BANK_TRANSFER");
        return payload;
    }

    private String createdCode(APIResponse res) {
        assertEquals(201, res.status(), res.text());
        return readJson(res).path("data").path("code").asText();
    }

    @Test
    void api_18_listBookingsAndFilterByGuestShouldWork() {
        assertEquals(401, getApi("/api/bookings").status());

        String guestToken = loginBearer("guest.demo", "123");
        APIResponse guestRes = getApi("/api/bookings?guestUsername=guest.demo", guestToken);
        assertEquals(200, guestRes.status());
        JsonNode data = readJson(guestRes).path("data");
        assertTrue(data.isArray() && !data.isEmpty());
        for (JsonNode b : data) {
            assertEquals("guest.demo", b.path("guestUsername").asText());
        }

        APIResponse otherGuest = getApi("/api/bookings?guestUsername=linh.tran", guestToken);
        assertEquals(200, otherGuest.status());
        assertTrue(readJson(otherGuest).path("data").isEmpty(), "Guest khong duoc xem don cua nguoi khac");

        APIResponse adminRes = getApi("/api/bookings", loginBearer("admin", "123"));
        assertEquals(200, adminRes.status());
        assertTrue(readJson(adminRes).path("data").isArray());
    }

    @Test
    void api_19_getBookingByCodeValidAndUnknownShouldReturn200And400() {
        String token = loginBearer("guest.demo", "123");

        APIResponse ok = getApi("/api/bookings/ODD-DEMO-0001", token);
        assertEquals(200, ok.status());
        assertEquals("ODD-DEMO-0001", readJson(ok).path("data").path("code").asText());

        APIResponse missing = getApi("/api/bookings/ODD-MISSING-" + uniqueTag(), token);
        assertEquals(400, missing.status());

        APIResponse otherUsersBooking = getApi("/api/bookings/ODD-DEMO-0001", loginBearer("linh.tran", "123"));
        assertEquals(403, otherUsersBooking.status());
    }

    @Test
    void api_20_createBookingShouldCalculateNightsAndTotalServerSide() {
        String token = loginBearer("guest.demo", "123");
        String[] dates = uniqueFutureDates(3);

        APIResponse res = postJson("/api/bookings", buildBookingPayload(1L, dates[0], dates[1]), token);
        String code = createdCode(res);
        JsonNode booking = readJson(res).path("data");
        assertTrue(code.startsWith("ODD-"));
        assertEquals("guest.demo", booking.path("guestUsername").asText());
        assertEquals(3, booking.path("nights").asInt());
        assertEquals(650000.0, booking.path("pricePerNight").asDouble(), 0.01);
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

        String code1 = createdCode(postJson("/api/bookings", buildBookingPayload(1L, dates[0], midDate), token));
        String code2 = createdCode(postJson("/api/bookings", buildBookingPayload(1L, midDate, endDate), token));

        postJson("/api/bookings/" + code1 + "/cancel", Map.of(), token);
        postJson("/api/bookings/" + code2 + "/cancel", Map.of(), token);
    }

    @Test
    void api_22_overlappingBookingShouldFailBR02UntilFirstBookingIsCancelled() {
        String token = loginBearer("guest.demo", "123");
        String[] base = uniqueFutureDates(3);
        String overlapStart = LocalDate.parse(base[0]).plusDays(1).toString();
        String overlapEnd = LocalDate.parse(base[1]).plusDays(1).toString();

        String code1 = createdCode(postJson("/api/bookings", buildBookingPayload(1L, base[0], base[1]), token));

        APIResponse blocked = postJson("/api/bookings", buildBookingPayload(1L, overlapStart, overlapEnd), token);
        assertEquals(400, blocked.status());

        assertEquals(200, postJson("/api/bookings/" + code1 + "/cancel", Map.of(), token).status());

        String code2 = createdCode(postJson("/api/bookings", buildBookingPayload(1L, overlapStart, overlapEnd), token));
        postJson("/api/bookings/" + code2 + "/cancel", Map.of(), token);
    }

    @Test
    void api_23_createBookingInvalidBoundariesShouldReturn400() {
        String token = loginBearer("guest.demo", "123");
        String[] dates = uniqueFutureDates(2);

        assertEquals(401, postJson("/api/bookings", buildBookingPayload(1L, dates[0], dates[1])).status());

        assertEquals(400, postJson("/api/bookings", buildBookingPayload(1L, dates[1], dates[0]), token).status());
        assertEquals(400, postJson("/api/bookings", buildBookingPayload(1L, dates[0], dates[0]), token).status());
        assertEquals(400, postJson("/api/bookings", buildBookingPayload(1L, "2028/05/01", dates[1]), token).status());

        Map<String, Object> zeroGuests = buildBookingPayload(1L, dates[0], dates[1]);
        zeroGuests.put("guests", 0);
        assertEquals(400, postJson("/api/bookings", zeroGuests, token).status());

        Map<String, Object> overCapacity = buildBookingPayload(1L, dates[0], dates[1]);
        overCapacity.put("guests", 5);
        assertEquals(400, postJson("/api/bookings", overCapacity, token).status());

        Map<String, Object> missingRoom = buildBookingPayload(1L, dates[0], dates[1]);
        missingRoom.remove("roomId");
        assertEquals(400, postJson("/api/bookings", missingRoom, token).status());

        Map<String, Object> wrongProperty = buildBookingPayload(1L, dates[0], dates[1]);
        wrongProperty.put("propertyId", 2L);
        assertEquals(400, postJson("/api/bookings", wrongProperty, token).status());
    }

    @Test
    void api_23b_clientSuppliedPriceStatusAndIdentityMustBeIgnored() {
        String token = loginBearer("guest.demo", "123");
        String[] dates = uniqueFutureDates(2);

        Map<String, Object> tampered = buildBookingPayload(1L, dates[0], dates[1]);
        tampered.put("guestUsername", "admin");
        tampered.put("pricePerNight", 1.0);
        tampered.put("subtotal", 1.0);
        tampered.put("total", 1.0);
        tampered.put("status", "COMPLETED");
        tampered.put("is_reviewed", true);
        tampered.put("code", "HACK-" + uniqueTag());

        APIResponse res = postJson("/api/bookings", tampered, token);
        String code = createdCode(res);
        JsonNode booking = readJson(res).path("data");
        assertEquals("guest.demo", booking.path("guestUsername").asText());
        assertEquals(1300000.0, booking.path("total").asDouble(), 0.01);
        assertEquals("PENDING", booking.path("status").asText());
        assertFalse(booking.path("is_reviewed").asBoolean());
        assertTrue(code.startsWith("ODD-"));

        postJson("/api/bookings/" + code + "/cancel", Map.of(), token);
    }

    @Test
    void api_24_bookingStatusLifecycleShouldTransitionPendingConfirmedCheckedInCompleted() {
        String hostToken = loginBearer("host.demo", "123");
        String guestToken = loginBearer("guest.demo", "123");
        String adminToken = loginBearer("admin", "123");
        String[] dates = uniqueFutureDates(2);

        String code = createdCode(postJson("/api/bookings", buildBookingPayload(1L, dates[0], dates[1]), guestToken));

        assertEquals(403, patchJson("/api/bookings/" + code + "/status", Map.of("status", "CONFIRMED"), guestToken).status());

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

        String code = createdCode(postJson("/api/bookings", buildBookingPayload(1L, dates[0], dates[1]), token));

        assertEquals(403, postJson("/api/bookings/" + code + "/cancel", Map.of(), loginBearer("linh.tran", "123")).status());

        APIResponse firstCancel = postJson("/api/bookings/" + code + "/cancel", Map.of(), token);
        assertEquals(200, firstCancel.status());
        assertEquals("CANCELLED", readJson(firstCancel).path("data").path("status").asText());

        APIResponse secondCancel = postJson("/api/bookings/" + code + "/cancel", Map.of(), token);
        assertEquals(400, secondCancel.status());
    }

    @Test
    void api_26_guestCannotCancelAlreadyCompletedBooking() {
        APIResponse res = postJson("/api/bookings/ODD-DEMO-0001/cancel", Map.of(), loginBearer("guest.demo", "123"));
        assertEquals(400, res.status());
    }

    @Test
    void api_27_adminCancelShouldCancelAndCreateAuditLogEntry() {
        String adminToken = loginBearer("admin", "123");
        String guestToken = loginBearer("guest.demo", "123");
        String[] dates = uniqueFutureDates(2);

        String code = createdCode(postJson("/api/bookings", buildBookingPayload(1L, dates[0], dates[1]), guestToken));

        assertEquals(403, postJson("/api/bookings/" + code + "/admin-cancel", Map.of("reason", "x"), guestToken).status());

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
    void api_36_invalidStatusTransitionsShouldBeRejectedByStateMachine() {
        String guestToken = loginBearer("guest.demo", "123");
        String hostToken = loginBearer("host.demo", "123");
        String[] dates = uniqueFutureDates(2);
        String code = createdCode(postJson("/api/bookings", buildBookingPayload(1L, dates[0], dates[1]), guestToken));
        String path = "/api/bookings/" + code + "/status";

        // PENDING không được nhảy thẳng sang CHECKED_IN/COMPLETED, và trạng thái lạ bị từ chối
        assertEquals(400, patchJson(path, Map.of("status", "COMPLETED"), hostToken).status());
        assertEquals(400, patchJson(path, Map.of("status", "CHECKED_IN"), hostToken).status());
        assertEquals(400, patchJson(path, Map.of("status", "ABC"), hostToken).status());
        assertEquals(400, patchJson(path, Map.of("status", "PENDING"), hostToken).status());

        assertEquals(200, patchJson(path, Map.of("status", "confirmed"), hostToken).status());
        assertEquals(400, patchJson(path, Map.of("status", "CONFIRMED"), hostToken).status());

        // Đã CHECKED_IN thì khách không còn tự hủy được
        assertEquals(200, patchJson(path, Map.of("status", "CHECKED_IN"), hostToken).status());
        assertEquals(400, postJson("/api/bookings/" + code + "/cancel", Map.of(), guestToken).status());

        assertEquals(200, patchJson(path, Map.of("status", "COMPLETED"), hostToken).status());
        // COMPLETED là trạng thái kết thúc
        assertEquals(400, patchJson(path, Map.of("status", "CANCELLED"), hostToken).status());

        postJson("/api/bookings/" + code + "/admin-cancel", Map.of("reason", "Cleanup state machine test"),
                loginBearer("admin", "123"));
    }

    @Test
    void api_37_concurrentBookingsForSameRoomAndDatesShouldCreateExactlyOne() throws Exception {
        String[] tokens = {loginBearer("guest.demo", "123"), loginBearer("linh.tran", "123")};
        HttpClient http = HttpClient.newHttpClient();
        int rounds = 5;

        for (int round = 0; round < rounds; round++) {
            String[] dates = uniqueFutureDates(2);
            String body = JSON.writeValueAsString(buildBookingPayload(2L, dates[0], dates[1]));

            int contenders = 6;
            CountDownLatch ready = new CountDownLatch(contenders);
            CountDownLatch go = new CountDownLatch(1);
            ExecutorService pool = Executors.newFixedThreadPool(contenders);
            List<Future<HttpResponse<String>>> results = new ArrayList<>();
            for (int i = 0; i < contenders; i++) {
                String token = tokens[i % tokens.length];
                results.add(pool.submit(() -> {
                    HttpRequest req = HttpRequest.newBuilder(URI.create(beUrl() + "/api/bookings"))
                            .header("Content-Type", "application/json; charset=UTF-8")
                            .header("Authorization", "Bearer " + token)
                            .POST(HttpRequest.BodyPublishers.ofString(body))
                            .build();
                    ready.countDown();
                    go.await();
                    return http.send(req, HttpResponse.BodyHandlers.ofString());
                }));
            }
            ready.await();
            go.countDown();

            List<String> createdCodes = new ArrayList<>();
            int conflicts = 0;
            for (Future<HttpResponse<String>> f : results) {
                HttpResponse<String> r = f.get(30, TimeUnit.SECONDS);
                if (r.statusCode() == 201) {
                    createdCodes.add(JSON.readTree(r.body()).path("data").path("code").asText());
                } else if (r.statusCode() == 400) {
                    conflicts++;
                }
            }
            pool.shutdown();

            assertEquals(1, createdCodes.size(),
                    "Vong " + round + ": chi duoc phep 1 don thanh cong, nhung tao duoc " + createdCodes);
            assertEquals(contenders - 1, conflicts);

            for (String code : createdCodes) {
                postJson("/api/bookings/" + code + "/cancel", Map.of(), tokens[0]);
                postJson("/api/bookings/" + code + "/admin-cancel", Map.of("reason", "cleanup"),
                        loginBearer("admin", "123"));
            }
        }
    }

    @Test
    void api_28_xssPayloadInBookingShouldReturnSafeJsonContentType() {
        String token = loginBearer("guest.demo", "123");
        String[] dates = uniqueFutureDates(2);
        Map<String, Object> body = buildBookingPayload(1L, dates[0], dates[1]);
        body.put("guestName", "<script>alert(1)</script>");

        APIResponse res = postJson("/api/bookings", body, token);
        String code = createdCode(res);
        String contentType = res.headers().getOrDefault("content-type", "");
        assertFalse(contentType.contains("text/html"));

        postJson("/api/bookings/" + code + "/cancel", Map.of(), token);
    }

    private int promoUsedCount(String promoCode, String token) {
        JsonNode promos = readJson(getApi("/api/promotions", token)).path("data");
        for (JsonNode p : promos) {
            if (promoCode.equalsIgnoreCase(p.path("code").asText())) {
                return p.path("usedCount").asInt(0);
            }
        }
        throw new IllegalStateException("Khong tim thay ma giam gia " + promoCode);
    }

    @Test
    void api_37_createBookingWithPromoCodeShouldApplyDiscountAndRejectInvalidPromo() {
        String token = loginBearer("guest.demo", "123");
        String adminToken = loginBearer("admin", "123");
        String[] dates = uniqueFutureDates(2);
        int usedBefore = promoUsedCount("ODAUDAY10", adminToken);

        Map<String, Object> validBody = buildBookingPayload(1L, dates[0], dates[1]);
        validBody.put("promoCode", "ODAUDAY10");
        APIResponse validRes = postJson("/api/bookings", validBody, token);
        String code = createdCode(validRes);
        JsonNode data = readJson(validRes).path("data");
        assertEquals(1300000.0, data.path("subtotal").asDouble(), 0.01);
        assertEquals(1170000.0, data.path("total").asDouble(), 0.01);
        assertEquals(usedBefore + 1, promoUsedCount("ODAUDAY10", adminToken));
        postJson("/api/bookings/" + code + "/cancel", Map.of(), token);

        String[] datesInvalid = uniqueFutureDates(2);
        Map<String, Object> invalidBody = buildBookingPayload(1L, datesInvalid[0], datesInvalid[1]);
        invalidBody.put("promoCode", "INVALID_PROMO_XYZ");
        APIResponse invalidRes = postJson("/api/bookings", invalidBody, token);
        assertEquals(400, invalidRes.status());
    }

    @Test
    void api_38_businessGuardsShouldBlockPastDatesRoomBlocksAndLockedProperty() {
        String guestToken = loginBearer("guest.demo", "123");
        String hostToken = loginBearer("host.demo", "123");
        String adminToken = loginBearer("admin", "123");

        // 1. Không cho đặt ngày nhận phòng trong quá khứ
        Map<String, Object> pastBody = buildBookingPayload(1L, "2020-01-10", "2020-01-12");
        assertEquals(400, postJson("/api/bookings", pastBody, guestToken).status());

        // 2. Tạo RoomBlock -> chặn đặt phòng trùng khoảng ngày; sau đó xóa RoomBlock
        String[] blockDates = uniqueFutureDates(2);
        Map<String, Object> blockReq = Map.of(
                "roomId", 1L,
                "roomName", "Phòng Garden",
                "start", blockDates[0],
                "end", blockDates[1],
                "reason", "Bao tri test"
        );
        APIResponse blockRes = postJson("/api/room-blocks", blockReq, hostToken);
        assertEquals(201, blockRes.status());
        long blockId = readJson(blockRes).path("data").path("id").asLong();
        assertEquals(400, postJson("/api/room-blocks", blockReq, hostToken).status());
        assertEquals(400, postJson("/api/bookings", buildBookingPayload(1L, blockDates[0], blockDates[1]), guestToken).status());
        assertEquals(200, deleteApi("/api/room-blocks/" + blockId, hostToken).status());

        // 3. Tạo đơn -> chặn tạo RoomBlock trùng khoảng ngày; sau đó hủy đơn
        String[] bookDates = uniqueFutureDates(2);
        String code = createdCode(postJson("/api/bookings", buildBookingPayload(1L, bookDates[0], bookDates[1]), guestToken));
        Map<String, Object> overlapBlock = Map.of(
                "roomId", 1L,
                "roomName", "Phòng Garden",
                "start", bookDates[0],
                "end", bookDates[1],
                "reason", "Trung don"
        );
        assertEquals(400, postJson("/api/room-blocks", overlapBlock, hostToken).status());
        postJson("/api/bookings/" + code + "/cancel", Map.of(), guestToken);

        // 4. Khóa cơ sở lưu trú -> chặn đặt phòng; mở khóa lại ngay
        assertEquals(200, patchJson("/api/properties/1/toggle-status", Map.of(), adminToken).status());
        try {
            String[] lockedDates = uniqueFutureDates(2);
            assertEquals(400, postJson("/api/bookings", buildBookingPayload(1L, lockedDates[0], lockedDates[1]), guestToken).status());
        } finally {
            patchJson("/api/properties/1/toggle-status", Map.of(), adminToken);
        }

        // 5. Mã khuyến mãi chưa tới validFrom (CHAOHE2027) bị từ chối
        assertEquals(400, postJson("/api/promotions/apply", Map.of("code", "CHAOHE2027", "orderAmount", 1500000.0)).status());
    }
}
