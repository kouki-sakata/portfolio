package com.example.teamdev.controller.api;

import com.example.teamdev.dto.api.news.NewsBulkDeleteRequest;
import com.example.teamdev.dto.api.news.NewsBulkOperationResponse;
import com.example.teamdev.dto.api.news.NewsBulkPublishRequest;
import com.example.teamdev.dto.api.news.NewsCreateRequest;
import com.example.teamdev.dto.api.news.NewsListResponse;
import com.example.teamdev.dto.api.news.NewsPublishRequest;
import com.example.teamdev.dto.api.news.NewsResponse;
import com.example.teamdev.dto.api.news.NewsUpdateRequest;
import com.example.teamdev.entity.News;
import com.example.teamdev.form.ListForm;
import com.example.teamdev.form.NewsManageForm;
import com.example.teamdev.service.NewsManageBulkDeletionService;
import com.example.teamdev.service.NewsManageBulkReleaseService;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(NewsRestController.class);

    private final NewsManageService newsManageService;
    private final NewsManageRegistrationService registrationService;
    private final NewsManageDeletionService deletionService;
    private final NewsManageReleaseService releaseService;
    private final NewsManageBulkDeletionService bulkDeletionService;
    private final NewsManageBulkReleaseService bulkReleaseService;

    public NewsRestController(
        NewsManageService newsManageService,
        NewsManageRegistrationService registrationService,
        NewsManageDeletionService deletionService,
        NewsManageReleaseService releaseService,
        NewsManageBulkDeletionService bulkDeletionService,
        NewsManageBulkReleaseService bulkReleaseService
    ) {
        this.newsManageService = newsManageService;
        this.registrationService = registrationService;
        this.deletionService = deletionService;
        this.releaseService = releaseService;
        this.bulkDeletionService = bulkDeletionService;
        this.bulkReleaseService = bulkReleaseService;
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
        NewsManageForm form = new NewsManageForm(
            "",
            request.newsDate(),
            request.title(),
            request.content(),
            request.label(),
            request.releaseFlag()
        );
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
        NewsManageForm form = new NewsManageForm(
            String.valueOf(id),
            request.newsDate(),
            request.title(),
            request.content(),
            request.label(),
            request.releaseFlag()
        );
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

    @Operation(summary = "お知らせ公開切り替え", description = "公開/非公開フラグを明示的に設定（ADMIN権限が必要）")
    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> togglePublish(
        @PathVariable Integer id,
        @Valid @RequestBody NewsPublishRequest request
    ) {
        requireExistingNews(id);
        Integer operatorId = requireCurrentEmployeeId();
        Map<String, String> edit = Map.of(
            "id", String.valueOf(id),
            "releaseFlag", Boolean.toString(request.releaseFlag())
        );
        ListForm listForm = new ListForm(List.of(String.valueOf(id)), List.of(edit));
        releaseService.execute(listForm, operatorId);
        return ResponseEntity.noContent().build();
    }

    @Operation(
        summary = "お知らせ一括削除",
        description = "複数のお知らせを一括で削除（最大100件、ADMIN権限が必要）"
    )
    @PostMapping("/bulk/delete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NewsBulkOperationResponse> bulkDelete(
        @Valid @RequestBody NewsBulkDeleteRequest request
    ) {
        Integer operatorId = requireCurrentEmployeeId();

        try {
            var result = bulkDeletionService.execute(request.ids(), operatorId);

            // ログ出力
            if (result.failureCount() > 0) {
                logger.warn("Bulk delete partial success: {} of {} items deleted",
                    result.successCount(), request.ids().size());
            } else {
                logger.info("Bulk delete completed: all {} items deleted successfully",
                    result.successCount());
            }

            NewsBulkOperationResponse response = new NewsBulkOperationResponse(
                result.successCount(),
                result.failureCount(),
                result.results()
            );

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            // バリデーションエラー（空リスト、サイズ上限超過など）
            logger.warn("Bulk delete validation error: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            // その他のエラー
            logger.error("Bulk delete failed", e);

            // エラーの詳細を取得
            String rootCause = extractRootCause(e);

            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "一括削除に失敗しました: " + rootCause
            );
        }
    }

    @Operation(
        summary = "お知らせ一括公開切り替え",
        description = "複数のお知らせの公開ステータスを一括変更（最大100件、ADMIN権限が必要）"
    )
    @PatchMapping("/bulk/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NewsBulkOperationResponse> bulkPublish(
        @Valid @RequestBody NewsBulkPublishRequest request
    ) {
        Integer operatorId = requireCurrentEmployeeId();

        try {
            var result = bulkReleaseService.executeIndividual(request.items(), operatorId);

            // ログ出力
            if (result.failureCount() > 0) {
                logger.warn("Bulk publish partial success: {} of {} items updated",
                    result.successCount(), request.items().size());
            } else {
                logger.info("Bulk publish completed: all {} items updated successfully",
                    result.successCount());
            }

            NewsBulkOperationResponse response = new NewsBulkOperationResponse(
                result.successCount(),
                result.failureCount(),
                result.results()
            );

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            // バリデーションエラー（空リスト、サイズ上限超過など）
            logger.warn("Bulk publish validation error: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            // その他のエラー
            logger.error("Bulk publish toggle failed", e);

            // エラーの詳細を取得
            String rootCause = extractRootCause(e);

            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "一括公開切り替えに失敗しました: " + rootCause
            );
        }
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
            news.getTitle(),
            news.getContent(),
            news.getLabel(),
            releaseFlag,
            updateDate
        );
    }

    /**
     * エラーの根本原因を抽出する
     *
     * @param e 例外
     * @return 根本原因のメッセージ
     */
    private String extractRootCause(Exception e) {
        Throwable cause = e;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        String message = cause.getMessage();
        return message != null ? message : "Unknown error";
    }
}
