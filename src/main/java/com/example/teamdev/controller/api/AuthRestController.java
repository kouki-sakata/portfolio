package com.example.teamdev.controller.api;

import com.example.teamdev.dto.api.auth.LoginRequest;
import com.example.teamdev.dto.api.auth.LoginResponse;
import com.example.teamdev.dto.api.auth.SessionResponse;
import com.example.teamdev.dto.api.common.EmployeeSummaryResponse;
import com.example.teamdev.service.AuthSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth", description = "認証/セッション API")
public class AuthRestController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final AuthSessionService authSessionService;

    public AuthRestController(
        AuthenticationManager authenticationManager,
        SecurityContextRepository securityContextRepository,
        AuthSessionService authSessionService
    ) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.authSessionService = authSessionService;
    }

    @Operation(summary = "ログイン", description = "メールとパスワードでログインし、セッションを開始します")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse httpResponse
    ) {
        UsernamePasswordAuthenticationToken authenticationToken = UsernamePasswordAuthenticationToken.unauthenticated(
            request.email(),
            request.password()
        );

        try {
            Authentication authentication = authenticationManager.authenticate(authenticationToken);
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            securityContextRepository.saveContext(context, httpRequest, httpResponse);

            EmployeeSummaryResponse employeeSummary = authSessionService.getEmployeeSummaryByEmail(authentication.getName());
            return ResponseEntity.ok(new LoginResponse(employeeSummary));
        } catch (AuthenticationException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials", ex);
        }
    }

    @Operation(summary = "セッション状態取得", description = "現在の認証状態と従業員概要を返します")
    @GetMapping("/session")
    public ResponseEntity<SessionResponse> session(CsrfToken csrfToken) {
        if (csrfToken != null) {
            csrfToken.getToken();
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.ok(new SessionResponse(false, null));
        }

        EmployeeSummaryResponse employeeSummary = authSessionService.getEmployeeSummaryByEmailOrNull(authentication.getName());
        if (employeeSummary == null) {
            return ResponseEntity.ok(new SessionResponse(false, null));
        }

        return ResponseEntity.ok(new SessionResponse(true, employeeSummary));
    }
}
