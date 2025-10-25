package com.example.teamdev.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.security.core.AuthenticationException;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private static final String ENV_TEST = "test";
    private static final String ENV_DEV = "dev";

    @Value("${app.environment:production}")
    private String environment;

    /**
     * CSRF Token Repository を環境に応じて設定
     * クロスサイトリクエスト（Vercel→Render）に対応するため SameSite=None を設定
     * 開発環境・テスト環境では Secure フラグを無効化し、HTTP でも Cookie が動作するようにする
     */
    private CookieCsrfTokenRepository csrfTokenRepository() {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();

        // 開発環境とテスト環境では Secure flag を無効化、SameSite=None 設定
        if (ENV_DEV.equals(environment) || ENV_TEST.equals(environment)) {
            repository.setCookieCustomizer(cookie -> cookie
                .secure(false)
                .sameSite("None")
            );
        } else {
            // 本番環境: Secure=true & SameSite=None でクロスサイトリクエストに対応
            repository.setCookieCustomizer(cookie -> cookie
                .secure(true)
                .sameSite("None")
            );
        }

        return repository;
    }

    /**
     * 環境に応じた CSRF トークンハンドラーを作成
     * テスト環境では Spring Security Test との互換性を保つため標準ハンドラーを使用
     * それ以外の環境では BREACH 攻撃対策を含むカスタムハンドラーを使用 (デフォルト)
     *
     * @return 環境に応じた CsrfTokenRequestHandler
     */
    private CsrfTokenRequestHandler createCsrfTokenRequestHandler() {
        if (ENV_TEST.equals(environment)) {
            return new CsrfTokenRequestAttributeHandler();
        }
        // デフォルトは本番環境用 (セキュア)
        return new CaseInsensitiveCsrfTokenRequestHandler();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        HttpSessionSecurityContextRepository repository = new HttpSessionSecurityContextRepository();
        repository.setDisableUrlRewriting(true);
        return repository;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /**
     * CORS設定
     * Vercel フロントエンドからのクロスオリジンリクエストを許可
     * 環境変数 CORS_ALLOWED_ORIGINS で制御
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
        @Value("${spring.web.cors.allowed-origins}") String allowedOrigins
    ) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(parseAllowedOrigins(allowedOrigins));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        // Expose CSRF token header for cross-origin requests
        configuration.setExposedHeaders(Arrays.asList("X-XSRF-TOKEN"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * 許可されたOriginを解析・検証
     * カンマ区切りの文字列をリストに変換し、各Originの形式を検証
     */
    private List<String> parseAllowedOrigins(String origins) {
        if (origins == null || origins.trim().isEmpty()) {
            throw new IllegalStateException("CORS_ALLOWED_ORIGINS must be set in production");
        }

        return Arrays.stream(origins.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .peek(this::validateOriginFormat)
            .collect(Collectors.toList());
    }

    /**
     * Origin形式の検証
     * ワイルドカード（*）や不正な形式を拒否
     */
    private void validateOriginFormat(String origin) {
        if ("*".equals(origin)) {
            throw new IllegalArgumentException("Wildcard origin (*) not allowed with credentials");
        }
        if (origin.contains("*")) {
            throw new IllegalArgumentException("Wildcard patterns not allowed with credentials: " + origin);
        }
        if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
            throw new IllegalArgumentException("Invalid origin format (must start with http:// or https://): " + origin);
        }
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository())
                .csrfTokenRequestHandler(createCsrfTokenRequestHandler())
                // Allow health endpoints, login, session, logout, and debug endpoints without CSRF to ease SPA auth flow and E2E tests
                .ignoringRequestMatchers("/actuator/**", "/api/auth/login", "/api/auth/session", "/api/auth/logout", "/api/debug/**")
            )
            // Add CSRF token to response headers for cross-origin scenarios
            .addFilterAfter(new CsrfHeaderFilter(), org.springframework.security.web.csrf.CsrfFilter.class)
            .authorizeHttpRequests(authz -> authz
                // API & Health endpoints only (SPA is hosted on Vercel)
                .requestMatchers(
                     "/",
                     "/signin",
                     "/index.html",
                     "/assets/**",
                     "/api/auth/login",
                     "/api/auth/session",
                     "/api/auth/logout",
                     "/api/public/**"
                 ).permitAll()
                // Actuator endpoints require authentication (401 entry point at line 216-218 will be effective)
                .requestMatchers("/actuator/health").permitAll() // Health check endpoint for external monitoring
                .requestMatchers(
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs",
                    "/v3/api-docs/**"
                ).permitAll()
                .requestMatchers("/api/news/published").permitAll()
                .requestMatchers("/employeemanage/**", "/newsmanage/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((request, response, authentication) -> response.setStatus(HttpServletResponse.SC_NO_CONTENT))
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            )
            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    new AntPathRequestMatcher("/api/**")
                )
                .defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    new AntPathRequestMatcher("/actuator/**")
                )
                .defaultAuthenticationEntryPointFor(
                    spaLoginEntryPoint(),
                    new AntPathRequestMatcher("/**")
                )
                .accessDeniedHandler((request, response, accessDeniedException) -> response.sendError(HttpServletResponse.SC_FORBIDDEN))
            )
            .securityContext(security -> security.securityContextRepository(securityContextRepository()))
            .sessionManagement(session -> session
                .maximumSessions(3)  // Allow multiple devices (PC + mobile + tablet)
                .maxSessionsPreventsLogin(false)
            )
            .headers(headers -> headers
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                .contentTypeOptions(Customizer.withDefaults())
                .httpStrictTransportSecurity(hsts -> hsts
                    .maxAgeInSeconds(31536000)
                    .includeSubDomains(true)
                )
                // CSP is managed by Vercel frontend (SPA hosting)
            );

        return http.build();
    }

    private AuthenticationEntryPoint spaLoginEntryPoint() {
        return new SpaLoginEntryPoint("/signin");
    }

    private static final class SpaLoginEntryPoint implements AuthenticationEntryPoint {

        private final RedirectStrategy redirectStrategy;
        private final String loginPath;

        private SpaLoginEntryPoint(String loginPath) {
            DefaultRedirectStrategy strategy = new DefaultRedirectStrategy();
            strategy.setContextRelative(true);
            this.redirectStrategy = strategy;
            this.loginPath = loginPath;
        }

        @Override
        public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
        ) throws IOException {
            redirectStrategy.sendRedirect(request, response, loginPath);
        }
    }
}
