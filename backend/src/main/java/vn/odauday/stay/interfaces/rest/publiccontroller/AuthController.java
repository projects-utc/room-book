package vn.odauday.stay.interfaces.rest.publiccontroller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.odauday.stay.application.model.user.AuthResponse;
import vn.odauday.stay.application.model.user.LoginRequest;
import vn.odauday.stay.application.model.user.RegisterRequest;
import vn.odauday.stay.application.model.user.UserResponse;
import vn.odauday.stay.application.service.user.AuthService;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody @Valid RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping({"/me", "/role"})
    public UserResponse checkRole(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        return authService.checkRole(authHeader);
    }

    @GetMapping("/users")
    public List<UserResponse> getAllUsers() {
        return authService.getAllUsers();
    }

    @PutMapping("/users/{id}/role")
    public UserResponse updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return authService.updateUserRole(id, body.get("role"));
    }

    @PutMapping("/users/{id}/status")
    public UserResponse updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return authService.updateUserStatus(id, body.get("status"));
    }
}
