package vn.odauday.stay.interfaces.rest.publiccontroller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.odauday.stay.application.common.ApiResponse;
import vn.odauday.stay.application.model.user.UserResponse;
import vn.odauday.stay.application.service.user.UserService;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<List<UserResponse>> getUsers() {
        return ApiResponse.ok(userService.getAllUsers());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserResponse> createUser(@RequestBody Map<String, String> body) {
        return ApiResponse.ok("Đã tạo người dùng thành công", userService.createUser(body));
    }

    @PatchMapping("/{id}/toggle-status")
    public ApiResponse<UserResponse> toggleUserStatus(@PathVariable Long id) {
        return ApiResponse.ok("Đã đổi trạng thái tài khoản", userService.toggleUserStatus(id));
    }

    @PatchMapping("/{id}/role")
    public ApiResponse<UserResponse> changeUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok("Đã thay đổi vai trò tài khoản", userService.changeUserRole(id, body.get("role")));
    }
}
