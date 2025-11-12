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
import org.springframework.boot.test.mockito.MockitoBean;
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
        News news = new News();
        news.setId(1);
        news.setNewsDate(LocalDate.parse("2025-10-10"));
        news.setTitle("システムメンテナンス");
        news.setContent("システムメンテナンスを予定しています。");
        news.setLabel("IMPORTANT");
        news.setReleaseFlag(true);
        news.setUpdateDate(Timestamp.from(Instant.parse("2025-10-09T12:34:56Z")));
        when(newsManageService.getAllNews()).thenReturn(List.of(news));

        mockMvc.perform(get("/api/news"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.news[0].id").value(1))
            .andExpect(jsonPath("$.news[0].newsDate").value("2025-10-10"))
            .andExpect(jsonPath("$.news[0].title").value("システムメンテナンス"))
            .andExpect(jsonPath("$.news[0].content").value("システムメンテナンスを予定しています。"))
            .andExpect(jsonPath("$.news[0].label").value("IMPORTANT"))
            .andExpect(jsonPath("$.news[0].releaseFlag").value(true))
            .andExpect(jsonPath("$.news[0].updateDate").value("2025-10-09T12:34:56Z"));
    }

    @DisplayName("GET /api/news/published returns published news without authentication")
    @Test
    void listPublishedNewsAllowsAnonymousAccess() throws Exception {
        News news = new News();
        news.setId(2);
        news.setNewsDate(LocalDate.parse("2025-10-11"));
        news.setTitle("公開済みのお知らせ");
        news.setContent("公開済みのお知らせです。");
        news.setLabel("GENERAL");
        news.setReleaseFlag(true);
        news.setUpdateDate(Timestamp.from(Instant.parse("2025-10-11T08:00:00Z")));
        when(newsManageService.getPublishedNews()).thenReturn(List.of(news));

        mockMvc.perform(get("/api/news/published"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.news[0].id").value(2))
            .andExpect(jsonPath("$.news[0].releaseFlag").value(true));
    }

    @DisplayName("POST /api/news creates news and returns payload")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void createNewsReturnsCreatedPayload() throws Exception {
        News created = new News();
        created.setId(5);
        created.setNewsDate(LocalDate.parse("2025-10-15"));
        created.setTitle("新規公開案内");
        created.setContent("新しいお知らせです。");
        created.setLabel("SYSTEM");
        created.setReleaseFlag(true);
        created.setUpdateDate(Timestamp.from(Instant.parse("2025-10-15T09:00:00Z")));
        when(registrationService.execute(any(NewsManageForm.class), eq(ADMIN_ID))).thenReturn(created);

        NewsCreateRequest request = new NewsCreateRequest(
            "2025-10-15",
            "新規公開案内",
            "新しいお知らせです。",
            "SYSTEM",
            true
        );

        mockMvc.perform(post("/api/news")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(5))
            .andExpect(jsonPath("$.title").value("新規公開案内"))
            .andExpect(jsonPath("$.label").value("SYSTEM"))
            .andExpect(jsonPath("$.releaseFlag").value(true));

        verify(registrationService).execute(
            argThat(formMatches("", "2025-10-15", "新規公開案内", "新しいお知らせです。", "SYSTEM", true)),
            eq(ADMIN_ID)
        );
    }

    @DisplayName("PUT /api/news/{id} updates existing news")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void updateNewsReturnsUpdatedPayload() throws Exception {
        int newsId = 9;
        News existing = new News();
        existing.setId(newsId);
        existing.setNewsDate(LocalDate.parse("2025-10-01"));
        existing.setTitle("旧タイトル");
        existing.setContent("旧コンテンツ");
        existing.setLabel("GENERAL");
        existing.setReleaseFlag(false);
        existing.setUpdateDate(Timestamp.from(Instant.parse("2025-10-01T10:00:00Z")));

        News updated = new News();
        updated.setId(newsId);
        updated.setNewsDate(LocalDate.parse("2025-10-20"));
        updated.setTitle("更新後タイトル");
        updated.setContent("更新後コンテンツ");
        updated.setLabel("IMPORTANT");
        updated.setReleaseFlag(true);
        updated.setUpdateDate(Timestamp.from(Instant.parse("2025-10-20T11:11:11Z")));

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
                      "label": "IMPORTANT",
                      "releaseFlag": true
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(newsId))
            .andExpect(jsonPath("$.newsDate").value("2025-10-20"))
            .andExpect(jsonPath("$.title").value("更新後タイトル"))
            .andExpect(jsonPath("$.content").value("更新後コンテンツ"))
            .andExpect(jsonPath("$.label").value("IMPORTANT"))
            .andExpect(jsonPath("$.releaseFlag").value(true));

        verify(registrationService).execute(
            argThat(formMatches(String.valueOf(newsId), "2025-10-20", "更新後タイトル", "更新後コンテンツ", "IMPORTANT", true)),
            eq(ADMIN_ID)
        );
    }

    @DisplayName("DELETE /api/news/{id} deletes news when found")
    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void deleteNewsReturnsNoContent() throws Exception {
        int newsId = 7;
        News existing = new News();
        existing.setId(newsId);
        existing.setNewsDate(LocalDate.parse("2025-09-01"));
        existing.setTitle("削除対象");
        existing.setContent("削除対象");
        existing.setLabel("GENERAL");
        existing.setReleaseFlag(false);
        existing.setUpdateDate(Timestamp.from(Instant.parse("2025-09-01T09:00:00Z")));
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
        News existing = new News();
        existing.setId(newsId);
        existing.setNewsDate(LocalDate.parse("2025-08-20"));
        existing.setTitle("下書きのお知らせ");
        existing.setContent("下書きのお知らせ");
        existing.setLabel("GENERAL");
        existing.setReleaseFlag(false);
        existing.setUpdateDate(Timestamp.from(Instant.parse("2025-08-20T08:30:00Z")));
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
                      "title": "存在しないお知らせ",
                      "content": "未存在更新",
                      "label": "GENERAL",
                      "releaseFlag": false
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

    private ArgumentMatcher<NewsManageForm> formMatches(
        String id,
        String newsDate,
        String title,
        String content,
        String label,
        boolean releaseFlag
    ) {
        return form -> form != null
            && ((id == null && form.getId() == null) || (id != null && id.equals(form.getId())))
            && newsDate.equals(form.getNewsDate())
            && title.equals(form.getTitle())
            && content.equals(form.getContent())
            && label.equals(form.getLabel())
            && Boolean.valueOf(releaseFlag).equals(form.getReleaseFlag());
    }
}
