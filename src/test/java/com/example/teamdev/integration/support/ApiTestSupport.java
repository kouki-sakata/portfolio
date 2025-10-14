package com.example.teamdev.integration.support;

import com.example.teamdev.testconfig.PostgresContainerSupport;
import com.example.teamdev.testconfig.TestSecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestSecurityConfig.class)
public abstract class ApiTestSupport extends PostgresContainerSupport {

    @Autowired protected MockMvc mockMvc;
    @Autowired protected JdbcTemplate jdbcTemplate;
    @Autowired protected PasswordEncoder passwordEncoder;
    @Autowired protected ObjectMapper objectMapper;

    protected void ensureAccount(String email, String rawPassword, boolean admin) {
        String encoded = passwordEncoder.encode(rawPassword);
        int updated = jdbcTemplate.update("UPDATE employee SET password = ?, admin_flag = ? WHERE email = ?",
            encoded,
            admin ? 1 : 0,
            email);
        if (updated == 0) {
            jdbcTemplate.update(
                "INSERT INTO employee (first_name, last_name, email, password, admin_flag, update_date) " +
                    "VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                admin ? "テスト" : "テスト",
                admin ? "管理者" : "太郎",
                email,
                encoded,
                admin ? 1 : 0
            );
        }
    }

    /**
     * テストユーザーでログインし、認証済みセッションを返す
     *
     * @param email ログインするユーザーのメールアドレス
     * @param password パスワード
     * @return 認証済み MockHttpSession
     * @throws Exception ログインに失敗した場合
     */
    protected MockHttpSession login(String email, String password) throws Exception {
        MvcResult loginResult = performLogin(email, password);
        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);

        ensureSecurityContext(session, email);
        return session;
    }

    /**
     * ログイン API を実行
     *
     * @param email メールアドレス
     * @param password パスワード
     * @return ログイン結果
     * @throws Exception API 実行に失敗した場合
     */
    private MvcResult performLogin(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(buildLoginJson(email, password)))
            .andExpect(status().isOk())
            .andReturn();
    }

    /**
     * セッションに SecurityContext が設定されていることを確認し、未設定の場合は手動で作成
     *
     * @param session 対象セッション
     * @param email ユーザーのメールアドレス
     */
    private void ensureSecurityContext(MockHttpSession session, String email) {
        if (session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY) != null) {
            return; // 既に設定済み
        }

        boolean isAdmin = fetchAdminFlag(email);
        List<SimpleGrantedAuthority> authorities = createAuthorities(isAdmin);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(email, null, authorities));
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
    }

    /**
     * データベースから管理者フラグを取得
     *
     * @param email ユーザーのメールアドレス
     * @return 管理者の場合 true、それ以外 false
     */
    private boolean fetchAdminFlag(String email) {
        Boolean isAdmin = jdbcTemplate.queryForObject(
            "SELECT admin_flag = 1 FROM employee WHERE email = ?",
            Boolean.class,
            email
        );
        // NULL 安全性: データベースから NULL が返された場合は false とする
        return Boolean.TRUE.equals(isAdmin);
    }

    /**
     * 管理者フラグに応じた権限リストを作成
     *
     * @param isAdmin 管理者フラグ
     * @return 権限リスト
     */
    private List<SimpleGrantedAuthority> createAuthorities(boolean isAdmin) {
        return isAdmin
            ? List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
            : List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    /**
     * ログイン API 用の JSON ペイロードを構築
     *
     * @param email メールアドレス
     * @param password パスワード
     * @return JSON 文字列
     */
    private String buildLoginJson(String email, String password) {
        return String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
    }

    protected static String uniqueEmail(String prefix) {
        return prefix + "." + System.currentTimeMillis() + "@example.com";
    }
}

