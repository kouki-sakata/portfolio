package com.example.teamdev.dto.api.news;

import java.util.List;

/**
 * バルク削除操作の結果
 */
public record BulkDeletionResult(
    int successCount,
    int failureCount,
    List<NewsBulkOperationResponse.OperationResult> results
) {}