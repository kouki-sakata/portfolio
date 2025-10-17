package com.example.teamdev.dto.api.news;

import java.util.List;

/**
 * バルク更新操作の結果
 */
public record BulkUpdateResult(
    int successCount,
    int failureCount,
    List<NewsBulkOperationResponse.OperationResult> results
) {}