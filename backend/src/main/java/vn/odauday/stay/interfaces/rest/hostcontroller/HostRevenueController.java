package vn.odauday.stay.interfaces.rest.hostcontroller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.odauday.stay.application.common.ApiResponse;
import vn.odauday.stay.application.model.booking.HostRevenueRow;
import vn.odauday.stay.application.service.booking.HostRevenueService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/host/revenue")
@PreAuthorize("hasRole('HOST')")
public class HostRevenueController {

    private final HostRevenueService hostRevenueService;

    @GetMapping
    public ApiResponse<List<HostRevenueRow>> getRevenue(Authentication authentication) {
        return ApiResponse.ok(hostRevenueService.getForHost(authentication.getName()));
    }
}
