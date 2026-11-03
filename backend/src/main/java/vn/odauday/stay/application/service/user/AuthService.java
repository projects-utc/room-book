package vn.odauday.stay.application.service.user;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.odauday.stay.application.common.exception.UnauthorizedException;
import vn.odauday.stay.application.model.user.AuthResponse;
import vn.odauday.stay.application.model.user.LoginRequest;
import vn.odauday.stay.application.model.user.RegisterRequest;
import vn.odauday.stay.application.model.user.UserResponse;
import vn.odauday.stay.domain.user.model.User;
import vn.odauday.stay.domain.user.persistent.UserRepository;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.secret:odaudaystaysecretkeyforjwttokengenerationshouldbelongenough256bit}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    private String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getId())
                .claim("role", user.getRole())
                .claim("email", user.getEmail())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    private String extractUsernameFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT: {}", e.getMessage());
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
        }
    }

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
        String token = generateToken(saved);
        log.info("Registered user: {}", saved.getUsername());

        return AuthResponse.builder()
                .token(token)
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

        String token = generateToken(user);
        log.info("User logged in: {} with role {}", user.getUsername(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(toUserResponse(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse checkRole(String authHeader) {
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Vui lòng đăng nhập để tiếp tục");
        }

        String token = authHeader.substring(7).trim();
        String username = extractUsernameFromToken(token);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không tồn tại trên hệ thống"));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new UnauthorizedException("Tài khoản này đang bị khóa bởi Quản trị viên");
        }

        return toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserResponse)
                .toList();
    }

    @Transactional
    public UserResponse updateUserRole(Long id, String newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản có ID: " + id));

        String role = newRole != null ? newRole.toUpperCase().trim() : "GUEST";
        if (!"ADMIN".equals(role) && !"HOST".equals(role)) {
            role = "GUEST";
        }

        user.setRole(role);
        User saved = userRepository.save(user);
        log.info("Updated user {} role to {}", saved.getUsername(), saved.getRole());
        return toUserResponse(saved);
    }

    @Transactional
    public UserResponse updateUserStatus(Long id, String newStatus) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản có ID: " + id));

        String status = "LOCKED".equalsIgnoreCase(newStatus) ? "LOCKED" : "ACTIVE";
        user.setStatus(status);
        User saved = userRepository.save(user);
        log.info("Updated user {} status to {}", saved.getUsername(), saved.getStatus());
        return toUserResponse(saved);
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
