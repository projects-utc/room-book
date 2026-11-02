package vn.odauday.stay.application.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
            .authorizeHttpRequests(this::configureAuthorizeHttpRequests)
            .exceptionHandling(exceptionHandling -> exceptionHandling
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    String msg = accessDeniedException.getMessage() != null ? accessDeniedException.getMessage() : "Access is denied";
                    response.getWriter().write("{\"error\":\"access_denied\",\"error_description\":\"" + msg + "\"}");
                })
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"" + HttpStatus.UNAUTHORIZED.getReasonPhrase() + "\"}");
                })
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }

    private void configureAuthorizeHttpRequests(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry authorizeRequests) {
        authorizeRequests
            .requestMatchers(authApiPatterns()).permitAll()
            .requestMatchers(publicApiPatterns()).permitAll()
            .requestMatchers(propertyApiPatterns()).permitAll()
            .requestMatchers(roomApiPatterns()).permitAll()
            .requestMatchers(reviewApiPatterns()).permitAll()
            .requestMatchers(swaggerApiPatterns()).permitAll()
            .requestMatchers(new AntPathRequestMatcher("/h2-console/**")).permitAll()
            .anyRequest().authenticated();
    }

    // region auth
    private static RequestMatcher[] authApiPatterns() {
        return new RequestMatcher[]{
            new AntPathRequestMatcher("/api/auth"),
            new AntPathRequestMatcher("/api/auth/**")
        };
    }
    // endregion

    // region public
    private static RequestMatcher[] publicApiPatterns() {
        return new RequestMatcher[]{
            new AntPathRequestMatcher("/api/public"),
            new AntPathRequestMatcher("/api/public/**")
        };
    }
    // endregion

    // region property
    private static RequestMatcher[] propertyApiPatterns() {
        return new RequestMatcher[]{
            new AntPathRequestMatcher("/api/properties"),
            new AntPathRequestMatcher("/api/properties/**")
        };
    }
    // endregion

    // region room
    private static RequestMatcher[] roomApiPatterns() {
        return new RequestMatcher[]{
            new AntPathRequestMatcher("/api/rooms"),
            new AntPathRequestMatcher("/api/rooms/**")
        };
    }
    // endregion

    // region review
    private static RequestMatcher[] reviewApiPatterns() {
        return new RequestMatcher[]{
            new AntPathRequestMatcher("/api/reviews"),
            new AntPathRequestMatcher("/api/reviews/**")
        };
    }
    // endregion

    // region swagger & error
    private static RequestMatcher[] swaggerApiPatterns() {
        return new RequestMatcher[]{
            new AntPathRequestMatcher("/v3/api-docs/**"),
            new AntPathRequestMatcher("/swagger-ui/**"),
            new AntPathRequestMatcher("/swagger-ui.html"),
            new AntPathRequestMatcher("/error")
        };
    }
    // endregion
}