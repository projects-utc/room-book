package vn.odauday.stay.interfaces.rest.admincontroller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.odauday.stay.application.common.ApiResponse;
import vn.odauday.stay.application.model.booking.HostRevenueRow;
import vn.odauday.stay.application.service.booking.HostRevenueService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/revenue")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRevenueController {

    private final HostRevenueService hostRevenueService;

    @GetMapping
    public ApiResponse<List<HostRevenueRow>> getRevenue() {
        return ApiResponse.ok(hostRevenueService.getAllForAdmin());
    }
}
