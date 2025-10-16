package com.example.teamdev.service;

import com.example.teamdev.dto.api.news.BulkUpdateResult;
import com.example.teamdev.dto.api.news.NewsBulkOperationResponse;
import com.example.teamdev.dto.api.news.NewsBulkPublishRequest;
import com.example.teamdev.mapper.NewsMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * お知らせ一括公開/非公開サービス
 */
@Service
public class NewsManageBulkReleaseService {

    private static final Logger logger = LoggerFactory.getLogger(NewsManageBulkReleaseService.class);
    private static final int MAX_BATCH_SIZE = 100;

    private final NewsMapper mapper;
    private final LogHistoryRegistrationService logHistoryService;
    private final Clock clock;

    public NewsManageBulkReleaseService(
        NewsMapper mapper,
        LogHistoryRegistrationService logHistoryService,
        Clock clock
    ) {
        this.mapper = mapper;
        this.logHistoryService = logHistoryService;
        this.clock = clock;
    }

    /**
     * 複数のお知らせの公開フラグを一括更新（全て同じフラグ値）
     *
     * @param ids 更新対象のIDリスト
     * @param releaseFlag 公開フラグ
     * @param operatorId 操作者ID
     * @return 更新件数
     */
    @Transactional
    public int executeUniform(List<Integer> ids, Boolean releaseFlag, Integer operatorId) {
        logger.debug("NewsManageBulkReleaseService.executeUniform started - operatorId: {}, ids count: {}, releaseFlag: {}",
            operatorId, ids.size(), releaseFlag);

        validateRequest(ids);

        try {
            Timestamp timestamp = Timestamp.from(clock.instant());
            int updatedCount = mapper.bulkUpdateReleaseFlag(ids, releaseFlag, timestamp);
            logger.info("Bulk updated release flag for {} news items to {}", updatedCount, releaseFlag);

            if (updatedCount > 0) {
                logHistoryService.execute(2, 5, null, null, operatorId, timestamp);
            }

            return updatedCount;

        } catch (Exception e) {
            logger.error("Error in bulk release flag update", e);
            throw e;
        }
    }

    /**
     * 複数のお知らせの公開フラグを個別に一括更新（事前検証型）
     *
     * @param items 更新アイテムリスト
     * @param operatorId 操作者ID
     * @return 更新結果（個別の成否を含む）
     */
    @Transactional
    public BulkUpdateResult executeIndividual(List<NewsBulkPublishRequest.NewsPublishItem> items, Integer operatorId) {
        logger.debug("NewsManageBulkReleaseService.executeIndividual started - operatorId: {}, items count: {}",
            operatorId, items.size());

        validateItemsRequest(items);

        // IDのみのリストを取得
        List<Integer> ids = items.stream()
            .map(NewsBulkPublishRequest.NewsPublishItem::id)
            .collect(Collectors.toList());

        // 事前検証：存在チェック
        List<Integer> existingIds = mapper.findExistingIds(ids);
        Set<Integer> existingSet = new HashSet<>(existingIds);

        // 結果の構築
        List<NewsBulkOperationResponse.OperationResult> results = new ArrayList<>();
        List<NewsBulkPublishRequest.NewsPublishItem> itemsToUpdate = new ArrayList<>();

        for (NewsBulkPublishRequest.NewsPublishItem item : items) {
            if (!existingSet.contains(item.id())) {
                // 存在しないID
                results.add(new NewsBulkOperationResponse.OperationResult(item.id(), false, "お知らせが見つかりません"));
                logger.debug("News ID {} not found", item.id());
            } else {
                itemsToUpdate.add(item);
            }
        }

        // バッチ更新（存在するアイテムのみ）
        int updatedCount = 0;
        if (!itemsToUpdate.isEmpty()) {
            try {
                Timestamp timestamp = Timestamp.from(clock.instant());
                updatedCount = mapper.bulkUpdateReleaseFlagIndividual(itemsToUpdate, timestamp);
                logger.info("Bulk updated release flag for {} news items (individual)", updatedCount);

                // 成功した更新を結果に追加
                for (NewsBulkPublishRequest.NewsPublishItem item : itemsToUpdate) {
                    results.add(new NewsBulkOperationResponse.OperationResult(item.id(), true, null));
                }

                // 履歴記録
                if (updatedCount > 0) {
                    logHistoryService.execute(2, 5, null, null, operatorId, timestamp);
                }
            } catch (Exception e) {
                logger.error("Error in bulk individual release flag update", e);
                // 更新エラー時は全て失敗として記録
                for (NewsBulkPublishRequest.NewsPublishItem item : itemsToUpdate) {
                    results.add(new NewsBulkOperationResponse.OperationResult(item.id(), false, "更新処理に失敗しました"));
                }
                throw e;
            }
        }

        int failureCount = items.size() - updatedCount;
        logger.debug("NewsManageBulkReleaseService.executeIndividual completed - updated: {}, failed: {}",
            updatedCount, failureCount);

        return new BulkUpdateResult(updatedCount, failureCount, results);
    }

    /**
     * 複数のお知らせの公開フラグを個別に一括更新（互換性のための旧メソッド）
     *
     * @param items 更新アイテムリスト
     * @param operatorId 操作者ID
     * @return 更新件数
     * @deprecated 代わりに executeIndividual(List<NewsPublishItem>, Integer) を使用してください
     */
    @Deprecated
    @Transactional
    public int executeIndividualSimple(List<NewsBulkPublishRequest.NewsPublishItem> items, Integer operatorId) {
        BulkUpdateResult result = executeIndividual(items, operatorId);
        return result.successCount();
    }

    private void validateItemsRequest(List<NewsBulkPublishRequest.NewsPublishItem> items) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("更新対象のアイテムリストが空です");
        }

        if (items.size() > MAX_BATCH_SIZE) {
            throw new IllegalArgumentException(
                String.format("一度に更新できるのは%d件までです（リクエスト: %d件）", MAX_BATCH_SIZE, items.size())
            );
        }
    }

    private void validateRequest(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("更新対象のIDリストが空です");
        }

        if (ids.size() > MAX_BATCH_SIZE) {
            throw new IllegalArgumentException(
                String.format("一度に更新できるのは%d件までです（リクエスト: %d件）", MAX_BATCH_SIZE, ids.size())
            );
        }
    }
}