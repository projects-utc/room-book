package vn.odauday.autotest.be;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.APIResponse;
import org.junit.jupiter.api.Test;
import vn.odauday.autotest.base.BasePlaywrightAutoTest;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class BeRoomPropertyApiAutoTest extends BasePlaywrightAutoTest {

    @Test
    void api_11_getPropertiesAndHotPropertiesShouldReturnSeededCatalog() {
        APIResponse allRes = getApi("/api/properties");
        assertEquals(200, allRes.status());
        JsonNode allData = readJson(allRes).path("data");
        assertTrue(allData.isArray() && allData.size() >= 14);

        APIResponse hotRes = getApi("/api/properties/hot");
        assertEquals(200, hotRes.status());
        JsonNode hotData = readJson(hotRes).path("data");
        assertTrue(hotData.isArray() && !hotData.isEmpty());
    }

    @Test
    void api_12_getPropertyByIdValidAndUnknownShouldReturn200And400() {
        APIResponse okRes = getApi("/api/properties/1");
        assertEquals(200, okRes.status());
        assertEquals(1L, readJson(okRes).path("data").path("id").asLong());

        APIResponse missingRes = getApi("/api/properties/999999");
        assertEquals(400, missingRes.status());
    }

    @Test
    void api_13_getRoomsAndRoomBlocksShouldFilterByIds() {
        APIResponse roomsRes = getApi("/api/rooms?propertyId=1");
        assertEquals(200, roomsRes.status());
        JsonNode rooms = readJson(roomsRes).path("data");
        assertTrue(rooms.isArray() && !rooms.isEmpty());
        for (JsonNode r : rooms) {
            assertEquals(1L, r.path("propertyId").asLong());
        }

        APIResponse blocksRes = getApi("/api/room-blocks?roomId=2");
        assertEquals(200, blocksRes.status());
        JsonNode blocks = readJson(blocksRes).path("data");
        assertTrue(blocks.isArray() && !blocks.isEmpty());
    }

    @Test
    void api_14_createToggleAndDeletePropertyLifecycleShouldCleanUp() {
        String hostToken = loginBearer("host.demo", "123");
        String tag = uniqueTag();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("owner", "host.demo");
        body.put("name", "Auto Test Villa " + tag);
        body.put("type", "Biệt thự");
        body.put("address", "123 Auto Test Road");
        body.put("city", "Hà Nội");
        body.put("area", "Hồ Tây");
        body.put("priceMin", 950000.0);
        body.put("desc", "Created by Playwright BE auto test");

        APIResponse created = postJson("/api/properties", body, hostToken);
        assertEquals(201, created.status());
        long propId = readJson(created).path("data").path("id").asLong();
        assertTrue(propId > 0);

        APIResponse toggled = patchJson("/api/properties/" + propId + "/toggle-status", Map.of(), hostToken);
        assertEquals(200, toggled.status());
        assertEquals("LOCKED", readJson(toggled).path("data").path("status").asText());

        Map<String, Object> roomBody = Map.of(
                "propertyId", propId,
                "propertyName", "Auto Test Villa " + tag,
                "name", "Child Room " + tag,
                "capacity", 2,
                "price", 500000.0
        );
        assertEquals(201, postJson("/api/rooms", roomBody, hostToken).status());

        APIResponse deleted = deleteApi("/api/properties/" + propId, hostToken);
        assertEquals(200, deleted.status());
        assertEquals(400, getApi("/api/properties/" + propId).status());
        assertEquals(0, readJson(getApi("/api/rooms?propertyId=" + propId)).path("data").size());
    }

    @Test
    void api_15_createAndDeleteRoomAndRoomBlockLifecycleShouldCleanUp() {
        String hostToken = loginBearer("host.demo", "123");
        String tag = uniqueTag();

        Map<String, Object> roomBody = new LinkedHashMap<>();
        roomBody.put("propertyId", 1L);
        roomBody.put("propertyName", "ODauDay Stay Hồ Tây");
        roomBody.put("name", "Auto Room " + tag);
        roomBody.put("capacity", 3);
        roomBody.put("price", 750000.0);
        roomBody.put("desc", "Synthetic test room");

        APIResponse roomRes = postJson("/api/rooms", roomBody, hostToken);
        assertEquals(201, roomRes.status());
        long roomId = readJson(roomRes).path("data").path("id").asLong();
        assertTrue(roomId > 0);

        String[] dates = uniqueFutureDates(2);
        Map<String, Object> blockBody = new LinkedHashMap<>();
        blockBody.put("roomId", roomId);
        blockBody.put("roomName", "Auto Room " + tag);
        blockBody.put("start", dates[0]);
        blockBody.put("end", dates[1]);
        blockBody.put("reason", "Auto test maintenance");

        APIResponse blockRes = postJson("/api/room-blocks", blockBody, hostToken);
        assertEquals(201, blockRes.status());
        long blockId = readJson(blockRes).path("data").path("id").asLong();
        assertTrue(blockId > 0);

        assertEquals(200, deleteApi("/api/room-blocks/" + blockId, hostToken).status());
        assertEquals(200, deleteApi("/api/rooms/" + roomId, hostToken).status());
    }

    @Test
    void api_16_pathTraversalOrMalformedIdShouldNeverSucceed() {
        APIResponse badId = getApi("/api/properties/..%2F..%2Fetc%2Fpasswd");
        assertTrue(badId.status() >= 400);
    }

    @Test
    void api_17_auditLogsListAndCreateShouldReturn200And201() {
        String adminToken = loginBearer("admin", "123");
        APIResponse listRes = getApi("/api/audit-logs", adminToken);
        assertEquals(200, listRes.status());
        assertTrue(readJson(listRes).path("data").isArray());

        String target = "AUTO-AUDIT-" + uniqueTag();
        APIResponse createRes = postJson("/api/audit-logs", Map.of(
                "action", "AUTO_TEST",
                "target", target,
                "details", "Verified audit creation over HTTP",
                "performedBy", "admin"
        ), adminToken);
        assertEquals(201, createRes.status());
        assertEquals(target, readJson(createRes).path("data").path("target").asText());
    }
}

