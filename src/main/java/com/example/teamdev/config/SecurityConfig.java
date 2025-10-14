package com.example.teamdev.config;

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
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Value("${app.environment:prod}")
    private String environment;

    /**
     * CSRF Token Repository を環境に応じて設定
     * 開発環境・テスト環境では Secure フラグを無効化し、HTTP でも Cookie が動作するようにする
     */
    private CookieCsrfTokenRepository csrfTokenRepository() {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();

        // 開発環境とテスト環境では Secure flag を無効化
        if ("dev".equals(environment) || "test".equals(environment)) {
            repository.setCookieCustomizer(cookie -> cookie.secure(false));
        }

        return repository;
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

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // ケースインセンシティブな CSRF トークンハンドラー
        CaseInsensitiveCsrfTokenRequestHandler csrfRequestHandler = new CaseInsensitiveCsrfTokenRequestHandler();

        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository())  // カスタムリポジトリを使用
                .csrfTokenRequestHandler(csrfRequestHandler)  // ケースインセンシティブハンドラーを使用
                // Allow health endpoints, login, logout, and debug endpoints without CSRF to ease SPA auth flow and E2E tests
                .ignoringRequestMatchers("/actuator/**", "/api/auth/login", "/api/auth/logout", "/api/debug/**")
            )
            .authorizeHttpRequests(authz -> authz
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/favicon.ico",
                    "/manifest.webmanifest",
                    "/assets/**"
                ).permitAll()
                .requestMatchers("/signin", "/signin/**").permitAll()
                .requestMatchers("/api/auth/login", "/api/auth/session", "/api/auth/logout", "/api/public/**").permitAll()
                .requestMatchers(
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs",
                    "/v3/api-docs/**"
                ).permitAll()
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
                .authenticationEntryPoint((request, response, authException) -> response.sendRedirect("/signin"))
                .accessDeniedHandler((request, response, accessDeniedException) -> response.sendError(HttpServletResponse.SC_FORBIDDEN))
            )
            .securityContext(security -> security.securityContextRepository(securityContextRepository()))
            .sessionManagement(session -> session
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
            )
            .headers(headers -> headers
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                .contentTypeOptions(Customizer.withDefaults())
                .httpStrictTransportSecurity(hsts -> hsts
                    .maxAgeInSeconds(31536000)
                    .includeSubDomains(true)
                )
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; " +
                        "script-src 'self'; " +
                        "style-src 'self' 'unsafe-inline'; " +
                        "font-src 'self'; " +
                        "img-src 'self' data:; " +
                        "connect-src 'self'; " +
                        "frame-ancestors 'none'")
                )
            );

        return http.build();
    }
}
