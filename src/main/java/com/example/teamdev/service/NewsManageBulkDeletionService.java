package com.example.teamdev.service;

import com.example.teamdev.dto.api.news.BulkDeletionResult;
import com.example.teamdev.dto.api.news.NewsBulkOperationResponse;
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

/**
 * お知らせ一括削除サービス
 */
@Service
public class NewsManageBulkDeletionService {

    private static final Logger logger = LoggerFactory.getLogger(NewsManageBulkDeletionService.class);
    private static final int MAX_BATCH_SIZE = 100;

    private final NewsMapper mapper;
    private final LogHistoryRegistrationService logHistoryService;
    private final Clock clock;

    public NewsManageBulkDeletionService(
        NewsMapper mapper,
        LogHistoryRegistrationService logHistoryService,
        Clock clock
    ) {
        this.mapper = mapper;
        this.logHistoryService = logHistoryService;
        this.clock = clock;
    }

    /**
     * お知らせを一括削除（事前検証型）
     *
     * @param ids 削除対象のIDリスト
     * @param operatorId 操作者ID
     * @return 削除結果（個別の成否を含む）
     * @throws IllegalArgumentException IDリストが空またはサイズ上限超過の場合
     */
    @Transactional
    public BulkDeletionResult execute(List<Integer> ids, Integer operatorId) {
        validateRequest(ids);

        logger.debug("NewsManageBulkDeletionService.execute started - operatorId: {}, ids count: {}",
            operatorId, ids.size());

        // 事前検証：存在チェック
        List<Integer> existingIds = mapper.findExistingIds(ids);
        Set<Integer> existingSet = new HashSet<>(existingIds);

        // 結果の構築
        List<NewsBulkOperationResponse.OperationResult> results = new ArrayList<>();
        for (Integer id : ids) {
            if (!existingSet.contains(id)) {
                // 存在しないID
                results.add(new NewsBulkOperationResponse.OperationResult(id, false, "お知らせが見つかりません"));
                logger.debug("News ID {} not found", id);
            }
        }

        // バッチ削除（存在するIDのみ）
        int deletedCount = 0;
        if (!existingIds.isEmpty()) {
            try {
                deletedCount = mapper.deleteByIds(existingIds);
                logger.info("Bulk deleted {} news items", deletedCount);

                // 削除件数が0の場合、存在確認したIDも失敗として扱う
                if (deletedCount == 0) {
                    for (Integer id : existingIds) {
                        results.add(new NewsBulkOperationResponse.OperationResult(id, false, "削除処理に失敗しました"));
                    }
                } else {
                    // 成功した削除を結果に追加
                    for (Integer id : existingIds) {
                        results.add(new NewsBulkOperationResponse.OperationResult(id, true, null));
                    }

                    // 履歴記録
                    Timestamp timestamp = Timestamp.from(clock.instant());
                    logHistoryService.execute(2, 4, null, null, operatorId, timestamp);
                }
            } catch (Exception e) {
                logger.error("Error in bulk deletion", e);
                // 削除エラー時は全て失敗として記録
                for (Integer id : existingIds) {
                    results.add(new NewsBulkOperationResponse.OperationResult(id, false, "削除処理に失敗しました"));
                }
                throw e;
            }
        }

        int failureCount = ids.size() - deletedCount;
        logger.debug("NewsManageBulkDeletionService.execute completed - deleted: {}, failed: {}",
            deletedCount, failureCount);

        return new BulkDeletionResult(deletedCount, failureCount, results);
    }

    /**
     * お知らせを一括削除（互換性のための旧メソッド）
     *
     * @param ids 削除対象のIDリスト
     * @param operatorId 操作者ID
     * @return 削除件数
     * @deprecated 代わりに execute(List<Integer>, Integer) を使用してください
     */
    @Deprecated
    @Transactional
    public int executeSimple(List<Integer> ids, Integer operatorId) {
        BulkDeletionResult result = execute(ids, operatorId);
        return result.successCount();
    }

    private void validateRequest(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("削除対象のIDリストが空です");
        }

        if (ids.size() > MAX_BATCH_SIZE) {
            throw new IllegalArgumentException(
                String.format("一度に削除できるのは%d件までです（リクエスト: %d件）", MAX_BATCH_SIZE, ids.size())
            );
        }
    }
}