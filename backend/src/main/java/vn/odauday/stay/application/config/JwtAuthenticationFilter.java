package vn.odauday.stay.application.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.odauday.stay.application.model.user.UserResponse;
import vn.odauday.stay.application.service.user.AuthService;

import java.io.IOException;
import java.util.List;

/**
 * Đọc "Authorization: Bearer <jwt>", xác thực chữ ký + hạn dùng + trạng thái tài khoản,
 * rồi đưa username và role (lấy từ DB, không lấy từ client) vào SecurityContext.
 * Token sai hoặc thiếu thì request đi tiếp như ẩn danh; SecurityConfig sẽ quyết định trả 401/403.
 */
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final AuthService authService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            try {
                UserResponse user = authService.getMe(header);
                var authentication = new UsernamePasswordAuthenticationToken(
                        user.getUsername(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase())));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (RuntimeException e) {
                SecurityContextHolder.clearContext();
                log.debug("Bỏ qua Bearer token không hợp lệ: {}", e.getMessage());
            }
        }
        chain.doFilter(request, response);
    }
}
