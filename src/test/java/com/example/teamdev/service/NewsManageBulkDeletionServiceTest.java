package com.example.teamdev.service;

import com.example.teamdev.dto.api.news.BulkDeletionResult;
import com.example.teamdev.dto.api.news.NewsBulkOperationResponse;
import com.example.teamdev.mapper.NewsMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NewsManageBulkDeletionService単体テスト")
class NewsManageBulkDeletionServiceTest {

    @Mock
    private NewsMapper mapper;

    @Mock
    private LogHistoryRegistrationService logHistoryService;

    @Mock
    private Clock clock;

    @InjectMocks
    private NewsManageBulkDeletionService service;

    private static final Instant FIXED_INSTANT = Instant.parse("2024-01-01T00:00:00Z");
    private static final Integer OPERATOR_ID = 1;

    @BeforeEach
    void setUp() {
        lenient().when(clock.instant()).thenReturn(FIXED_INSTANT);
    }

    @Test
    @DisplayName("正常系: 複数のお知らせを一括削除（BulkDeletionResult版）")
    void testBulkDeleteSuccessWithResult() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3, 4, 5);
        when(mapper.findExistingIds(ids)).thenReturn(ids);  // 全てのIDが存在
        when(mapper.deleteByIds(ids)).thenReturn(5);

        // Act
        BulkDeletionResult result = service.execute(ids, OPERATOR_ID);

        // Assert
        assertNotNull(result);
        assertEquals(5, result.successCount());
        assertEquals(0, result.failureCount());
        assertEquals(5, result.results().size());

        // 全ての結果が成功であることを確認
        for (int i = 0; i < ids.size(); i++) {
            NewsBulkOperationResponse.OperationResult opResult = result.results().get(i);
            assertEquals(ids.get(i), opResult.id());
            assertTrue(opResult.success());
            assertNull(opResult.errorMessage());
        }

        verify(mapper, times(1)).findExistingIds(ids);
        verify(mapper, times(1)).deleteByIds(ids);
        verify(logHistoryService, times(1)).execute(
            eq(2), eq(4), eq(null), eq(null), eq(OPERATOR_ID), any(Timestamp.class)
        );
    }

    @Test
    @DisplayName("正常系: 複数のお知らせを一括削除（旧メソッド互換性）")
    void testBulkDeleteSuccessSimple() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3, 4, 5);
        when(mapper.findExistingIds(ids)).thenReturn(ids);
        when(mapper.deleteByIds(ids)).thenReturn(5);

        // Act
        int deletedCount = service.executeSimple(ids, OPERATOR_ID);

        // Assert
        assertEquals(5, deletedCount);
        verify(mapper, times(1)).findExistingIds(ids);
        verify(mapper, times(1)).deleteByIds(ids);
        verify(logHistoryService, times(1)).execute(
            eq(2), eq(4), eq(null), eq(null), eq(OPERATOR_ID), any(Timestamp.class)
        );
    }

    @Test
    @DisplayName("正常系: 1件のお知らせを削除")
    void testSingleDelete() {
        // Arrange
        List<Integer> ids = Collections.singletonList(1);
        when(mapper.findExistingIds(ids)).thenReturn(ids);
        when(mapper.deleteByIds(ids)).thenReturn(1);

        // Act
        BulkDeletionResult result = service.execute(ids, OPERATOR_ID);

        // Assert
        assertEquals(1, result.successCount());
        assertEquals(0, result.failureCount());
        assertEquals(1, result.results().size());
        assertTrue(result.results().get(0).success());

        verify(mapper, times(1)).findExistingIds(ids);
        verify(mapper, times(1)).deleteByIds(ids);
        verify(logHistoryService, times(1)).execute(
            eq(2), eq(4), eq(null), eq(null), eq(OPERATOR_ID), any(Timestamp.class)
        );
    }

    @Test
    @DisplayName("部分成功: 一部のIDが存在しない場合")
    void testPartialSuccess() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3, 4, 5);
        List<Integer> existingIds = Arrays.asList(1, 3, 5);  // 2と4は存在しない
        when(mapper.findExistingIds(ids)).thenReturn(existingIds);
        when(mapper.deleteByIds(existingIds)).thenReturn(3);

        // Act
        BulkDeletionResult result = service.execute(ids, OPERATOR_ID);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.successCount());
        assertEquals(2, result.failureCount());
        assertEquals(5, result.results().size());

        // 結果の詳細を確認
        int successCount = 0;
        int failureCount = 0;
        for (NewsBulkOperationResponse.OperationResult opResult : result.results()) {
            if (existingIds.contains(opResult.id())) {
                // 存在するIDは成功
                assertTrue(opResult.success(), "ID " + opResult.id() + " should succeed");
                assertNull(opResult.errorMessage());
                successCount++;
            } else {
                // 存在しないIDは失敗
                assertFalse(opResult.success(), "ID " + opResult.id() + " should fail");
                assertEquals("お知らせが見つかりません", opResult.errorMessage());
                failureCount++;
            }
        }
        assertEquals(3, successCount);
        assertEquals(2, failureCount);

        verify(mapper, times(1)).findExistingIds(ids);
        verify(mapper, times(1)).deleteByIds(existingIds);
        verify(logHistoryService, times(1)).execute(
            eq(2), eq(4), eq(null), eq(null), eq(OPERATOR_ID), any(Timestamp.class)
        );
    }

    @Test
    @DisplayName("全件失敗: 全てのIDが存在しない場合")
    void testAllFailure() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3, 4, 5);
        List<Integer> existingIds = Collections.emptyList();  // 全て存在しない
        when(mapper.findExistingIds(ids)).thenReturn(existingIds);

        // Act
        BulkDeletionResult result = service.execute(ids, OPERATOR_ID);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.successCount());
        assertEquals(5, result.failureCount());
        assertEquals(5, result.results().size());

        // 全ての結果が失敗であることを確認
        for (NewsBulkOperationResponse.OperationResult opResult : result.results()) {
            assertFalse(opResult.success());
            assertEquals("お知らせが見つかりません", opResult.errorMessage());
        }

        verify(mapper, times(1)).findExistingIds(ids);
        verify(mapper, never()).deleteByIds(any());  // 削除は実行されない
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());  // ログも記録されない
    }

    @Test
    @DisplayName("異常系: 空のIDリスト")
    void testEmptyIdList() {
        // Arrange
        List<Integer> ids = Collections.emptyList();

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> service.execute(ids, OPERATOR_ID)
        );
        assertEquals("削除対象のIDリストが空です", exception.getMessage());
    }

    @Test
    @DisplayName("異常系: nullのIDリスト")
    void testNullIdList() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> service.execute(null, OPERATOR_ID)
        );
        assertEquals("削除対象のIDリストが空です", exception.getMessage());
    }

    @Test
    @DisplayName("異常系: 100件を超えるIDリスト")
    void testExceedMaxBatchSize() {
        // Arrange
        List<Integer> ids = new java.util.ArrayList<>();
        for (int i = 1; i <= 101; i++) {
            ids.add(i);
        }

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> service.execute(ids, OPERATOR_ID)
        );
        assertTrue(exception.getMessage().contains("一度に削除できるのは100件まで"));
    }

    @Test
    @DisplayName("正常系: 削除件数が0の場合、ログ記録をスキップ")
    void testNoItemsDeleted() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3);
        when(mapper.findExistingIds(ids)).thenReturn(ids);
        when(mapper.deleteByIds(ids)).thenReturn(0);

        // Act
        BulkDeletionResult result = service.execute(ids, OPERATOR_ID);

        // Assert
        assertEquals(0, result.successCount());
        assertEquals(3, result.failureCount());  // 削除できなかった場合は失敗としてカウント
        assertEquals(3, result.results().size());

        // 全ての結果が失敗であることを確認
        for (NewsBulkOperationResponse.OperationResult opResult : result.results()) {
            assertFalse(opResult.success());
            assertEquals("削除処理に失敗しました", opResult.errorMessage());
        }

        verify(mapper, times(1)).findExistingIds(ids);
        verify(mapper, times(1)).deleteByIds(ids);
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("異常系: マッパーでの削除中に例外発生")
    void testMapperException() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3);
        RuntimeException mapperException = new RuntimeException("Database error");
        when(mapper.findExistingIds(ids)).thenReturn(ids);
        when(mapper.deleteByIds(ids)).thenThrow(mapperException);

        // Act & Assert
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> service.execute(ids, OPERATOR_ID)
        );
        assertEquals("Database error", exception.getMessage());
        verify(mapper, times(1)).findExistingIds(ids);
        verify(mapper, times(1)).deleteByIds(ids);
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("異常系: 削除処理中の例外でロールバック")
    void testDeletionExceptionHandling() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3);
        when(mapper.findExistingIds(ids)).thenReturn(Arrays.asList(1, 2));  // 1と2は存在
        when(mapper.deleteByIds(Arrays.asList(1, 2))).thenThrow(new RuntimeException("Constraint violation"));

        // Act & Assert
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> service.execute(ids, OPERATOR_ID)
        );

        assertEquals("Constraint violation", exception.getMessage());

        // 検証: findExistingIdsとdeleteByIdsが呼び出されたが、ログは記録されない
        verify(mapper, times(1)).findExistingIds(ids);
        verify(mapper, times(1)).deleteByIds(Arrays.asList(1, 2));
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }
}