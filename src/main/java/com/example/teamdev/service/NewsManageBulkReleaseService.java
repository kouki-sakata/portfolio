package com.example.teamdev.service;

import com.example.teamdev.dto.api.news.NewsBulkPublishRequest;
import com.example.teamdev.mapper.NewsMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.util.List;

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
     * 複数のお知らせの公開フラグを個別に一括更新（異なるフラグ値）
     *
     * @param items 更新アイテムリスト
     * @param operatorId 操作者ID
     * @return 更新件数
     */
    @Transactional
    public int executeIndividual(List<NewsBulkPublishRequest.NewsPublishItem> items, Integer operatorId) {
        logger.debug("NewsManageBulkReleaseService.executeIndividual started - operatorId: {}, items count: {}",
            operatorId, items.size());

        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("更新対象のアイテムリストが空です");
        }

        if (items.size() > MAX_BATCH_SIZE) {
            throw new IllegalArgumentException(
                String.format("一度に更新できるのは%d件までです（リクエスト: %d件）", MAX_BATCH_SIZE, items.size())
            );
        }

        try {
            Timestamp timestamp = Timestamp.from(clock.instant());
            int updatedCount = mapper.bulkUpdateReleaseFlagIndividual(items, timestamp);
            logger.info("Bulk updated release flag for {} news items (individual)", updatedCount);

            if (updatedCount > 0) {
                logHistoryService.execute(2, 5, null, null, operatorId, timestamp);
            }

            return updatedCount;

        } catch (Exception e) {
            logger.error("Error in bulk individual release flag update", e);
            throw e;
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