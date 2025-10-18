package com.example.teamdev.controller.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.teamdev.dto.api.news.BulkDeletionResult;
import com.example.teamdev.dto.api.news.BulkUpdateResult;
import com.example.teamdev.dto.api.news.NewsBulkDeleteRequest;
import com.example.teamdev.dto.api.news.NewsBulkOperationResponse;
import com.example.teamdev.dto.api.news.NewsBulkPublishRequest;
import com.example.teamdev.dto.api.news.NewsCreateRequest;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.entity.News;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.form.NewsManageForm;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.service.NewsManageDeletionService;
import com.example.teamdev.service.NewsManageRegistrationService;
import com.example.teamdev.service.NewsManageReleaseService;
import com.example.teamdev.service.NewsManageBulkDeletionService;
import com.example.teamdev.service.NewsManageBulkReleaseService;
import com.example.teamdev.service.NewsManageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatcher;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.teamdev.config.SecurityConfig;
import com.example.teamdev.util.SecurityUtil;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;

@WebMvcTest(controllers = NewsRestController.class)
@Import({SecurityConfig.class, SecurityUtil.class})
@ActiveProfiles("test")
@Tag("api")
@TestPropertySource(properties = "app.environment=test")
class NewsRestControllerTest {

    private static final String ADMIN_EMAIL = "admin@example.com";
    private static final Integer ADMIN_ID = 101;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private NewsManageService newsManageService;

    @MockitoBean
    private NewsManageRegistrationService registrationService;

    @MockitoBean
    private NewsManageDeletionService deletionService;

    @MockitoBean
    private NewsManageReleaseService releaseService;

    @MockitoBean
    private NewsManageBulkDeletionService bulkDeletionService;

    @MockitoBean
    private NewsManageBulkReleaseService bulkReleaseService;

    @MockitoBean
    private EmployeeMapper employeeMapper;

    @BeforeEach
    void stubAdminEmployee() {
        Employee admin = new Employee(
            ADMIN_ID,
            "管理者",
            "太郎",
            ADMIN_EMAIL,
            "encoded",
            1,
            Timestamp.from(Instant.parse("2025-01-01T00:00:00Z"))
        );
        when(employeeMapper.getEmployeeByEmail(ADMIN_EMAIL)).thenReturn(admin);
    }

    @DisplayName("GET /api/news returns admin news list")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void listAllNewsReturnsAdminView() throws Exception {
        News news = new News(
            1,
            LocalDate.parse("2025-10-10"),
            "システムメンテナンスのお知らせ",
            "システムメンテナンスを予定しています。",
            "システム",
            true,
            Timestamp.from(Instant.parse("2025-10-09T12:34:56Z"))
        );
        when(newsManageService.getAllNews()).thenReturn(List.of(news));

        mockMvc.perform(get("/api/news"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.news[0].id").value(1))
            .andExpect(jsonPath("$.news[0].newsDate").value("2025-10-10"))
            .andExpect(jsonPath("$.news[0].title").value("システムメンテナンスのお知らせ"))
            .andExpect(jsonPath("$.news[0].content").value("システムメンテナンスを予定しています。"))
            .andExpect(jsonPath("$.news[0].category").value("システム"))
            .andExpect(jsonPath("$.news[0].releaseFlag").value(true))
            .andExpect(jsonPath("$.news[0].updateDate").value("2025-10-09T12:34:56Z"));
    }

    @DisplayName("GET /api/news/published returns published news without authentication")
    @Test
    void listPublishedNewsAllowsAnonymousAccess() throws Exception {
        News news = new News(
            2,
            LocalDate.parse("2025-10-11"),
            "公開お知らせ",
            "公開済みのお知らせです。",
            "一般",
            true,
            Timestamp.from(Instant.parse("2025-10-11T08:00:00Z"))
        );
        when(newsManageService.getPublishedNews()).thenReturn(List.of(news));

        mockMvc.perform(get("/api/news/published"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.news[0].id").value(2))
            .andExpect(jsonPath("$.news[0].title").value("公開お知らせ"))
            .andExpect(jsonPath("$.news[0].category").value("一般"))
            .andExpect(jsonPath("$.news[0].releaseFlag").value(true));
    }

    @DisplayName("POST /api/news creates news and returns payload")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void createNewsReturnsCreatedPayload() throws Exception {
        News created = new News(
            5,
            LocalDate.parse("2025-10-15"),
            "システムメンテナンス予定",
            "新しいお知らせです。",
            "システム",
            false,
            Timestamp.from(Instant.parse("2025-10-15T09:00:00Z"))
        );
        when(registrationService.execute(any(NewsManageForm.class), eq(ADMIN_ID))).thenReturn(created);

        NewsCreateRequest request = new NewsCreateRequest(
            "2025-10-15",
            "システムメンテナンス予定",
            "新しいお知らせです。",
            "システム"
        );

        mockMvc.perform(post("/api/news")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(5))
            .andExpect(jsonPath("$.title").value("システムメンテナンス予定"))
            .andExpect(jsonPath("$.category").value("システム"))
            .andExpect(jsonPath("$.releaseFlag").value(false));

        verify(registrationService).execute(
            argThat(formMatches("", "2025-10-15", "システムメンテナンス予定", "新しいお知らせです。", "システム")),
            eq(ADMIN_ID)
        );
    }

    @DisplayName("PUT /api/news/{id} updates existing news")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void updateNewsReturnsUpdatedPayload() throws Exception {
        int newsId = 9;
        News existing = new News(
            newsId,
            LocalDate.parse("2025-10-01"),
            "旧タイトル",
            "旧コンテンツ",
            "一般",
            false,
            Timestamp.from(Instant.parse("2025-10-01T10:00:00Z"))
        );
        News updated = new News(
            newsId,
            LocalDate.parse("2025-10-20"),
            "更新後タイトル",
            "更新後コンテンツ",
            "重要",
            false,
            Timestamp.from(Instant.parse("2025-10-20T11:11:11Z"))
        );

        when(newsManageService.getById(newsId)).thenReturn(Optional.of(existing));
        when(registrationService.execute(any(NewsManageForm.class), eq(ADMIN_ID))).thenReturn(updated);

        mockMvc.perform(put("/api/news/{id}", newsId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "newsDate": "2025-10-20",
                      "title": "更新後タイトル",
                      "content": "更新後コンテンツ",
                      "category": "重要"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(newsId))
            .andExpect(jsonPath("$.newsDate").value("2025-10-20"))
            .andExpect(jsonPath("$.title").value("更新後タイトル"))
            .andExpect(jsonPath("$.content").value("更新後コンテンツ"))
            .andExpect(jsonPath("$.category").value("重要"));

        verify(registrationService).execute(
            argThat(formMatches(String.valueOf(newsId), "2025-10-20", "更新後タイトル", "更新後コンテンツ", "重要")),
            eq(ADMIN_ID)
        );
    }

    @DisplayName("DELETE /api/news/{id} deletes news when found")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void deleteNewsReturnsNoContent() throws Exception {
        int newsId = 7;
        News existing = new News(
            newsId,
            LocalDate.parse("2025-09-01"),
            "削除予定のお知らせ",
            "削除対象",
            "一般",
            false,
            Timestamp.from(Instant.parse("2025-09-01T09:00:00Z"))
        );
        when(newsManageService.getById(newsId)).thenReturn(Optional.of(existing));

        mockMvc.perform(delete("/api/news/{id}", newsId)
                .with(csrf()))
            .andExpect(status().isNoContent());

        verify(deletionService).execute(
            argThat((ListForm form) -> form.getIdList().contains(String.valueOf(newsId))),
            eq(ADMIN_ID)
        );
    }

    @DisplayName("PATCH /api/news/{id}/publish toggles release flag")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void togglePublishFlipsReleaseFlag() throws Exception {
        int newsId = 12;
        News existing = new News(
            newsId,
            LocalDate.parse("2025-08-20"),
            "下書き状態のタイトル",
            "下書きのお知らせ",
            "一般",
            false,
            Timestamp.from(Instant.parse("2025-08-20T08:30:00Z"))
        );
        when(newsManageService.getById(newsId)).thenReturn(Optional.of(existing));

        mockMvc.perform(patch("/api/news/{id}/publish", newsId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"releaseFlag\": true}"))
            .andExpect(status().isNoContent());

        verify(releaseService).execute(
            argThat((ListForm form) -> {
                List<Map<String, String>> editList = form.getEditList();
                return editList != null
                    && editList.size() == 1
                    && editList.get(0).get("id").equals(String.valueOf(newsId))
                    && editList.get(0).get("releaseFlag").equals("true");
            }),
            eq(ADMIN_ID)
        );
    }

    @DisplayName("PUT /api/news/{id} returns 404 when news is absent")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void updateNewsReturnsNotFoundWhenMissing() throws Exception {
        int missingId = 404;
        when(newsManageService.getById(missingId)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/news/{id}", missingId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "newsDate": "2025-10-20",
                      "title": "未存在タイトル",
                      "content": "未存在更新",
                      "category": "一般"
                    }
                    """))
            .andExpect(status().isNotFound());

        verify(registrationService, never()).execute(any(NewsManageForm.class), eq(ADMIN_ID));
    }

    @DisplayName("DELETE /api/news/{id} requires authentication")
    @Test
    void deleteNewsRequiresAuthentication() throws Exception {
        mockMvc.perform(delete("/api/news/{id}", 15).with(csrf()))
            .andExpect(result -> assertThat(result.getResponse().getStatus()).isIn(401, 302));
    }

    @DisplayName("POST /api/news/bulk/delete deletes multiple news items")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void bulkDeleteNewsReturnsPartialSuccess() throws Exception {
        // Arrange - 部分成功シナリオ
        List<Integer> ids = List.of(1, 2, 3, 4, 5);
        List<NewsBulkOperationResponse.OperationResult> results = List.of(
            new NewsBulkOperationResponse.OperationResult(1, true, null),
            new NewsBulkOperationResponse.OperationResult(2, true, null),
            new NewsBulkOperationResponse.OperationResult(3, false, "お知らせが見つかりません"),
            new NewsBulkOperationResponse.OperationResult(4, true, null),
            new NewsBulkOperationResponse.OperationResult(5, false, "お知らせが見つかりません")
        );
        BulkDeletionResult mockResult = new BulkDeletionResult(3, 2, results);

        when(bulkDeletionService.execute(eq(ids), eq(ADMIN_ID))).thenReturn(mockResult);

        NewsBulkDeleteRequest request = new NewsBulkDeleteRequest(ids);

        // Act & Assert
        mockMvc.perform(post("/api/news/bulk/delete")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.successCount").value(3))
            .andExpect(jsonPath("$.failureCount").value(2))
            .andExpect(jsonPath("$.results[0].id").value(1))
            .andExpect(jsonPath("$.results[0].success").value(true))
            .andExpect(jsonPath("$.results[2].id").value(3))
            .andExpect(jsonPath("$.results[2].success").value(false))
            .andExpect(jsonPath("$.results[2].errorMessage").value("お知らせが見つかりません"));

        verify(bulkDeletionService).execute(eq(ids), eq(ADMIN_ID));
    }

    @DisplayName("PATCH /api/news/bulk/publish updates multiple news release flags")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void bulkPublishNewsHandlesPartialSuccess() throws Exception {
        // Arrange - 部分成功シナリオ
        List<NewsBulkPublishRequest.NewsPublishItem> items = List.of(
            new NewsBulkPublishRequest.NewsPublishItem(1, true),
            new NewsBulkPublishRequest.NewsPublishItem(2, false),
            new NewsBulkPublishRequest.NewsPublishItem(3, true),
            new NewsBulkPublishRequest.NewsPublishItem(4, true)
        );
        List<NewsBulkOperationResponse.OperationResult> results = List.of(
            new NewsBulkOperationResponse.OperationResult(1, true, null),
            new NewsBulkOperationResponse.OperationResult(2, true, null),
            new NewsBulkOperationResponse.OperationResult(3, false, "お知らせが見つかりません"),
            new NewsBulkOperationResponse.OperationResult(4, true, null)
        );
        BulkUpdateResult mockResult = new BulkUpdateResult(3, 1, results);

        when(bulkReleaseService.executeIndividual(eq(items), eq(ADMIN_ID))).thenReturn(mockResult);

        NewsBulkPublishRequest request = new NewsBulkPublishRequest(items);

        // Act & Assert
        mockMvc.perform(patch("/api/news/bulk/publish")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.successCount").value(3))
            .andExpect(jsonPath("$.failureCount").value(1))
            .andExpect(jsonPath("$.results[0].success").value(true))
            .andExpect(jsonPath("$.results[2].success").value(false))
            .andExpect(jsonPath("$.results[2].errorMessage").value("お知らせが見つかりません"));

        verify(bulkReleaseService).executeIndividual(eq(items), eq(ADMIN_ID));
    }

    @DisplayName("POST /api/news/bulk/delete handles complete success")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void bulkDeleteNewsAllSuccess() throws Exception {
        // Arrange - 全件成功シナリオ
        List<Integer> ids = List.of(10, 20, 30);
        List<NewsBulkOperationResponse.OperationResult> results = List.of(
            new NewsBulkOperationResponse.OperationResult(10, true, null),
            new NewsBulkOperationResponse.OperationResult(20, true, null),
            new NewsBulkOperationResponse.OperationResult(30, true, null)
        );
        BulkDeletionResult mockResult = new BulkDeletionResult(3, 0, results);

        when(bulkDeletionService.execute(eq(ids), eq(ADMIN_ID))).thenReturn(mockResult);

        NewsBulkDeleteRequest request = new NewsBulkDeleteRequest(ids);

        // Act & Assert
        mockMvc.perform(post("/api/news/bulk/delete")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.successCount").value(3))
            .andExpect(jsonPath("$.failureCount").value(0))
            .andExpect(jsonPath("$.results", org.hamcrest.Matchers.hasSize(3)));

        verify(bulkDeletionService).execute(eq(ids), eq(ADMIN_ID));
    }

    @DisplayName("POST /api/news/bulk/delete returns 400 for empty list")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void bulkDeleteNewsRejectEmptyList() throws Exception {
        // Arrange
        when(bulkDeletionService.execute(eq(List.of()), eq(ADMIN_ID)))
            .thenThrow(new IllegalArgumentException("削除対象のIDリストが空です"));

        NewsBulkDeleteRequest request = new NewsBulkDeleteRequest(List.of());

        // Act & Assert
        mockMvc.perform(post("/api/news/bulk/delete")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @DisplayName("PATCH /api/news/bulk/publish requires authentication")
    @Test
    void bulkPublishNewsRequiresAuthentication() throws Exception {
        NewsBulkPublishRequest request = new NewsBulkPublishRequest(
            List.of(new NewsBulkPublishRequest.NewsPublishItem(1, true))
        );

        mockMvc.perform(patch("/api/news/bulk/publish")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(result -> assertThat(result.getResponse().getStatus()).isIn(401, 302));
    }

    @DisplayName("POST /api/news validates title length (max 200)")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void createNewsRejectsTooLongTitle() throws Exception {
        String tooLongTitle = "あ".repeat(201);

        mockMvc.perform(post("/api/news")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "newsDate": "2025-10-15",
                      "title": "%s",
                      "content": "内容",
                      "category": "一般"
                    }
                    """.formatted(tooLongTitle)))
            .andExpect(status().isBadRequest());
    }

    @DisplayName("POST /api/news validates title is required")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void createNewsRejectsEmptyTitle() throws Exception {
        mockMvc.perform(post("/api/news")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "newsDate": "2025-10-15",
                      "title": "",
                      "content": "内容",
                      "category": "一般"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @DisplayName("POST /api/news validates category enum")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void createNewsRejectsInvalidCategory() throws Exception {
        mockMvc.perform(post("/api/news")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "newsDate": "2025-10-15",
                      "title": "タイトル",
                      "content": "内容",
                      "category": "無効なカテゴリ"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @DisplayName("POST /api/news validates category is required")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void createNewsRejectsEmptyCategory() throws Exception {
        mockMvc.perform(post("/api/news")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "newsDate": "2025-10-15",
                      "title": "タイトル",
                      "content": "内容",
                      "category": ""
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    private ArgumentMatcher<NewsManageForm> formMatches(String id, String newsDate, String title, String content, String category) {
        return form -> form != null
            && ((id == null && form.getId() == null) || (id != null && id.equals(form.getId())))
            && newsDate.equals(form.getNewsDate())
            && title.equals(form.getTitle())
            && content.equals(form.getContent())
            && category.equals(form.getCategory());
    }
}
