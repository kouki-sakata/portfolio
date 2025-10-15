package com.example.teamdev.controller.api;

import com.example.teamdev.dto.api.news.NewsCreateRequest;
import com.example.teamdev.dto.api.news.NewsListResponse;
import com.example.teamdev.dto.api.news.NewsResponse;
import com.example.teamdev.dto.api.news.NewsUpdateRequest;
import com.example.teamdev.entity.News;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.form.NewsManageForm;
import com.example.teamdev.service.NewsManageDeletionService;
import com.example.teamdev.service.NewsManageRegistrationService;
import com.example.teamdev.service.NewsManageReleaseService;
import com.example.teamdev.service.NewsManageService;
import com.example.teamdev.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/news")
@Tag(name = "News Management", description = "お知らせ管理 API")
public class NewsRestController {

    private final NewsManageService newsManageService;
    private final NewsManageRegistrationService registrationService;
    private final NewsManageDeletionService deletionService;
    private final NewsManageReleaseService releaseService;

    public NewsRestController(
        NewsManageService newsManageService,
        NewsManageRegistrationService registrationService,
        NewsManageDeletionService deletionService,
        NewsManageReleaseService releaseService
    ) {
        this.newsManageService = newsManageService;
        this.registrationService = registrationService;
        this.deletionService = deletionService;
        this.releaseService = releaseService;
    }

    @Operation(summary = "お知らせ一覧取得", description = "すべてのお知らせを日付降順で取得（管理者向け）")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NewsListResponse> listAll() {
        List<NewsResponse> news = newsManageService.getAllNews().stream()
            .map(this::toResponse)
            .toList();
        return ResponseEntity.ok(new NewsListResponse(news));
    }

    @Operation(summary = "公開お知らせ一覧取得", description = "公開フラグがtrueのお知らせを日付降順で取得")
    @GetMapping("/published")
    public ResponseEntity<NewsListResponse> listPublished() {
        List<NewsResponse> news = newsManageService.getPublishedNews().stream()
            .map(this::toResponse)
            .toList();
        return ResponseEntity.ok(new NewsListResponse(news));
    }

    @Operation(summary = "お知らせ作成", description = "新規お知らせを作成（ADMIN権限が必要）")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NewsResponse> create(@Valid @RequestBody NewsCreateRequest request) {
        Integer operatorId = requireCurrentEmployeeId();
        NewsManageForm form = new NewsManageForm("", request.newsDate(), request.content());
        News created = registrationService.execute(form, operatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }

    @Operation(summary = "お知らせ更新", description = "既存お知らせを更新（ADMIN権限が必要）")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NewsResponse> update(
        @PathVariable Integer id,
        @Valid @RequestBody NewsUpdateRequest request
    ) {
        requireExistingNews(id);
        Integer operatorId = requireCurrentEmployeeId();
        NewsManageForm form = new NewsManageForm(String.valueOf(id), request.newsDate(), request.content());
        News updated = registrationService.execute(form, operatorId);
        return ResponseEntity.ok(toResponse(updated));
    }

    @Operation(summary = "お知らせ削除", description = "指定IDのお知らせを削除（ADMIN権限が必要）")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        requireExistingNews(id);
        Integer operatorId = requireCurrentEmployeeId();
        ListForm listForm = new ListForm(List.of(String.valueOf(id)), null);
        deletionService.execute(listForm, operatorId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "お知らせ公開切り替え", description = "公開/非公開フラグをトグル（ADMIN権限が必要）")
    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> togglePublish(@PathVariable Integer id) {
        News news = requireExistingNews(id);
        Integer operatorId = requireCurrentEmployeeId();
        boolean nextFlag = !Boolean.TRUE.equals(news.getReleaseFlag());
        Map<String, String> edit = Map.of(
            "id", String.valueOf(id),
            "releaseFlag", Boolean.toString(nextFlag)
        );
        ListForm listForm = new ListForm(List.of(String.valueOf(id)), List.of(edit));
        releaseService.execute(listForm, operatorId);
        return ResponseEntity.noContent().build();
    }

    private Integer requireCurrentEmployeeId() {
        Integer operatorId = SecurityUtil.getCurrentEmployeeId();
        if (operatorId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return operatorId;
    }

    private News requireExistingNews(Integer id) {
        Optional<News> news = newsManageService.getById(id);
        return news.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "News not found"));
    }

    private NewsResponse toResponse(News news) {
        boolean releaseFlag = Boolean.TRUE.equals(news.getReleaseFlag());
        String updateDate = news.getUpdateDate() != null
            ? OffsetDateTime.ofInstant(news.getUpdateDate().toInstant(), ZoneOffset.UTC).toString()
            : null;
        return new NewsResponse(
            news.getId(),
            news.getNewsDate() != null ? news.getNewsDate().toString() : null,
            news.getContent(),
            releaseFlag,
            updateDate
        );
    }
}
