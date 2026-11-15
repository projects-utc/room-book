package vn.odauday.stay.application.service.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.application.model.user.UserResponse;
import vn.odauday.stay.application.service.audit.AuditLogService;
import vn.odauday.stay.domain.user.model.User;
import vn.odauday.stay.domain.user.persistent.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(authService::toUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse createUser(Map<String, String> body) {
        String username = body.get("username");
        String password = body.getOrDefault("password", "123");
        String fullName = body.get("fullName");
        String phone = body.getOrDefault("phone", "");
        String email = body.getOrDefault("email", "");
        String role = body.getOrDefault("role", "GUEST");

        if (username == null || username.isBlank() || fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException("Thông tin người dùng không hợp lệ");
        }
        if (userRepository.existsByUsername(username.trim().toLowerCase())) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại");
        }

        User u = User.builder()
                .username(username.trim().toLowerCase())
                .password(passwordEncoder.encode(password))
                .fullName(fullName.trim())
                .phone(phone.trim())
                .email(email.trim())
                .role(role.toUpperCase())
                .status("ACTIVE")
                .build();

        User saved = userRepository.save(u);
        return authService.toUserResponse(saved);
    }

    @Transactional
    public UserResponse toggleUserStatus(Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng có ID: " + id));

        if ("admin".equalsIgnoreCase(u.getUsername())) {
            throw new IllegalArgumentException("Không thể khóa tài khoản quản trị viên tối cao");
        }

        String nextStatus = "ACTIVE".equalsIgnoreCase(u.getStatus()) ? "LOCKED" : "ACTIVE";
        u.setStatus(nextStatus);
        User saved = userRepository.save(u);
        auditLogService.logAudit(nextStatus.equals("LOCKED") ? "LOCK" : "UNLOCK", u.getUsername(), "Đổi trạng thái tài khoản: " + nextStatus, "admin");
        return authService.toUserResponse(saved);
    }

    @Transactional
    public UserResponse changeUserRole(Long id, String newRole) {
        if (newRole == null || newRole.isBlank()) {
            throw new IllegalArgumentException("Vai trò mới không được để trống");
        }
        User u = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng có ID: " + id));

        if ("admin".equalsIgnoreCase(u.getUsername()) && !"ADMIN".equalsIgnoreCase(newRole)) {
            throw new IllegalArgumentException("Không thể hạ quyền của tài khoản admin");
        }

        u.setRole(newRole.trim().toUpperCase());
        User saved = userRepository.save(u);
        auditLogService.logAudit("CHANGE_ROLE", u.getUsername(), "Thay đổi vai trò thành " + u.getRole(), "admin");
        return authService.toUserResponse(saved);
    }
}

