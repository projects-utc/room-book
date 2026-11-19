package vn.odauday.stay.application.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import vn.odauday.stay.application.service.user.AuthService;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    /** Danh sách origin được phép gọi API từ trình duyệt, ngăn cách bằng dấu phẩy. */
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:8080,https://frontend-vx35.onrender.com}")
    private List<String> allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, AuthService authService) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable) // API stateless dùng Bearer token, không dùng cookie phiên
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(new JwtAuthenticationFilter(authService), UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/error", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                // Xác thực
                .requestMatchers(HttpMethod.GET, "/api/auth/health").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/me", "/api/auth/check-role").authenticated()

                // Chỉ ADMIN: quản lý người dùng, nhật ký hệ thống, mã giảm giá
                .requestMatchers("/api/auth/users", "/api/auth/users/**",
                                 "/api/users", "/api/users/**",
                                 "/api/audit-logs", "/api/audit-logs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/promotions/apply").permitAll()
                .requestMatchers("/api/promotions", "/api/promotions/**").hasRole("ADMIN")

                // Danh mục công khai (chỉ đọc)
                .requestMatchers(HttpMethod.GET,
                                 "/api/properties", "/api/properties/**",
                                 "/api/rooms", "/api/rooms/**",
                                 "/api/room-blocks", "/api/room-blocks/**",
                                 "/api/reviews", "/api/reviews/**").permitAll()

                // Ghi dữ liệu chỗ nghỉ/phòng: HOST hoặc ADMIN
                .requestMatchers("/api/properties", "/api/properties/**",
                                 "/api/rooms", "/api/rooms/**",
                                 "/api/room-blocks", "/api/room-blocks/**").hasAnyRole("HOST", "ADMIN")

                // Đặt phòng
                .requestMatchers(HttpMethod.GET, "/api/bookings/revenue").hasAnyRole("HOST", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/bookings/*/status").hasAnyRole("HOST", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/bookings/*/admin-cancel").hasRole("ADMIN")

                // Còn lại (đặt phòng, hủy phòng, viết đánh giá...) cần đăng nhập
                .anyRequest().authenticated()
            )
            .exceptionHandling(handling -> handling
                .authenticationEntryPoint((request, response, ex) -> writeJson(response,
                        HttpServletResponse.SC_UNAUTHORIZED, "Vui lòng đăng nhập để tiếp tục"))
                .accessDeniedHandler((request, response, ex) -> writeJson(response,
                        HttpServletResponse.SC_FORBIDDEN, "Bạn không có quyền thực hiện thao tác này"))
            );

        return http.build();
    }

    private static void writeJson(HttpServletResponse response, int status, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
