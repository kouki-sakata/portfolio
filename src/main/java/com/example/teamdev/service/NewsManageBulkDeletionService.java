package com.example.teamdev.service;

import com.example.teamdev.mapper.NewsMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.util.List;

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
     * お知らせを一括削除
     *
     * @param ids 削除対象のIDリスト
     * @param operatorId 操作者ID
     * @return 削除件数
     * @throws IllegalArgumentException IDリストが空またはサイズ上限超過の場合
     */
    @Transactional
    public int execute(List<Integer> ids, Integer operatorId) {
        logger.debug("NewsManageBulkDeletionService.execute started - operatorId: {}, ids count: {}",
            operatorId, ids.size());

        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("削除対象のIDリストが空です");
        }

        if (ids.size() > MAX_BATCH_SIZE) {
            throw new IllegalArgumentException(
                String.format("一度に削除できるのは%d件までです（リクエスト: %d件）", MAX_BATCH_SIZE, ids.size())
            );
        }

        try {
            // 一括削除実行
            int deletedCount = mapper.deleteByIds(ids);
            logger.info("Bulk deleted {} news items", deletedCount);

            if (deletedCount > 0) {
                // 履歴記録
                Timestamp timestamp = Timestamp.from(clock.instant());
                logHistoryService.execute(2, 4, null, null, operatorId, timestamp);
            }

            logger.debug("NewsManageBulkDeletionService.execute completed - deleted: {}", deletedCount);
            return deletedCount;

        } catch (Exception e) {
            logger.error("Error in bulk deletion", e);
            throw e;
        }
    }
}