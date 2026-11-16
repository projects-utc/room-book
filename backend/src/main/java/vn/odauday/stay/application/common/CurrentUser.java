package vn.odauday.stay.application.common;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import vn.odauday.stay.application.common.exception.UnauthorizedException;

/**
 * Người dùng đang đăng nhập, lấy từ SecurityContext (đã được JwtAuthenticationFilter xác thực).
 * Dùng thay cho việc tin vào username/role do client gửi trong request body.
 */
public record CurrentUser(String username, String role) {

    public static CurrentUser from(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null || "anonymousUser".equals(authentication.getName())) {
            throw new UnauthorizedException("Vui lòng đăng nhập để tiếp tục");
        }
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()))
                .findFirst()
                .orElse("GUEST");
        return new CurrentUser(authentication.getName(), role);
    }

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }

    public boolean isHost() {
        return "HOST".equals(role);
    }

    public void requireAdmin() {
        if (!isAdmin()) {
            throw new AccessDeniedException("Chỉ quản trị viên mới có quyền thực hiện thao tác này");
        }
    }
}
