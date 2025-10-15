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

import com.example.teamdev.dto.api.news.NewsCreateRequest;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.entity.News;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.form.NewsManageForm;
import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.service.NewsManageDeletionService;
import com.example.teamdev.service.NewsManageRegistrationService;
import com.example.teamdev.service.NewsManageReleaseService;
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
import org.springframework.boot.test.mock.mockito.MockBean;
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

    @MockBean
    private NewsManageService newsManageService;

    @MockBean
    private NewsManageRegistrationService registrationService;

    @MockBean
    private NewsManageDeletionService deletionService;

    @MockBean
    private NewsManageReleaseService releaseService;

    @MockBean
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
            "システムメンテナンスを予定しています。",
            true,
            Timestamp.from(Instant.parse("2025-10-09T12:34:56Z"))
        );
        when(newsManageService.getAllNews()).thenReturn(List.of(news));

        mockMvc.perform(get("/api/news"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.news[0].id").value(1))
            .andExpect(jsonPath("$.news[0].newsDate").value("2025-10-10"))
            .andExpect(jsonPath("$.news[0].content").value("システムメンテナンスを予定しています。"))
            .andExpect(jsonPath("$.news[0].releaseFlag").value(true))
            .andExpect(jsonPath("$.news[0].updateDate").value("2025-10-09T12:34:56Z"));
    }

    @DisplayName("GET /api/news/published returns published news without authentication")
    @Test
    void listPublishedNewsAllowsAnonymousAccess() throws Exception {
        News news = new News(
            2,
            LocalDate.parse("2025-10-11"),
            "公開済みのお知らせです。",
            true,
            Timestamp.from(Instant.parse("2025-10-11T08:00:00Z"))
        );
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
        News created = new News(
            5,
            LocalDate.parse("2025-10-15"),
            "新しいお知らせです。",
            false,
            Timestamp.from(Instant.parse("2025-10-15T09:00:00Z"))
        );
        when(registrationService.execute(any(NewsManageForm.class), eq(ADMIN_ID))).thenReturn(created);

        NewsCreateRequest request = new NewsCreateRequest("2025-10-15", "新しいお知らせです。");

        mockMvc.perform(post("/api/news")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(5))
            .andExpect(jsonPath("$.releaseFlag").value(false));

        verify(registrationService).execute(
            argThat(formMatches("", "2025-10-15", "新しいお知らせです。")),
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
            "旧コンテンツ",
            false,
            Timestamp.from(Instant.parse("2025-10-01T10:00:00Z"))
        );
        News updated = new News(
            newsId,
            LocalDate.parse("2025-10-20"),
            "更新後コンテンツ",
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
                      "content": "更新後コンテンツ"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(newsId))
            .andExpect(jsonPath("$.newsDate").value("2025-10-20"))
            .andExpect(jsonPath("$.content").value("更新後コンテンツ"));

        verify(registrationService).execute(
            argThat(formMatches(String.valueOf(newsId), "2025-10-20", "更新後コンテンツ")),
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
            "削除対象",
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
            "下書きのお知らせ",
            false,
            Timestamp.from(Instant.parse("2025-08-20T08:30:00Z"))
        );
        when(newsManageService.getById(newsId)).thenReturn(Optional.of(existing));

        mockMvc.perform(patch("/api/news/{id}/publish", newsId)
                .with(csrf()))
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
                      "content": "未存在更新"
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

    private ArgumentMatcher<NewsManageForm> formMatches(String id, String newsDate, String content) {
        return form -> form != null
            && ((id == null && form.getId() == null) || (id != null && id.equals(form.getId())))
            && newsDate.equals(form.getNewsDate())
            && content.equals(form.getContent());
    }
}
