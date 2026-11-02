package vn.odauday.stay.application.service.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.odauday.stay.application.model.user.AuthResponse;
import vn.odauday.stay.application.model.user.LoginRequest;
import vn.odauday.stay.application.model.user.RegisterRequest;
import vn.odauday.stay.application.model.user.UserResponse;
import vn.odauday.stay.domain.user.model.User;
import vn.odauday.stay.domain.user.persistent.UserRepository;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại trên hệ thống");
        }

        if (StringUtils.hasText(request.getEmail()) && userRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("Email này đã được sử dụng");
        }

        String role = StringUtils.hasText(request.getRole()) ? request.getRole().toUpperCase() : "GUEST";
        if (!"HOST".equals(role) && !"ADMIN".equals(role)) {
            role = "GUEST";
        }

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : "")
                .email(request.getEmail() != null ? request.getEmail().trim() : "")
                .role(role)
                .status("ACTIVE")
                .build();

        User saved = userRepository.save(user);
        log.info("Registered user: {}", saved.getUsername());

        return AuthResponse.builder()
                .token(UUID.randomUUID().toString())
                .tokenType("Bearer")
                .user(toUserResponse(saved))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String username = request.getUsername().trim().toLowerCase();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại trên hệ thống"));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalStateException("Tài khoản này đang bị khóa bởi Quản trị viên");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu không chính xác");
        }

        log.info("User logged in: {}", user.getUsername());

        return AuthResponse.builder()
                .token(UUID.randomUUID().toString())
                .tokenType("Bearer")
                .user(toUserResponse(user))
                .build();
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}