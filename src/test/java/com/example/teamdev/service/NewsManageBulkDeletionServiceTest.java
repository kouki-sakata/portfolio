package com.example.teamdev.service;

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
        when(clock.instant()).thenReturn(FIXED_INSTANT);
    }

    @Test
    @DisplayName("正常系: 複数のお知らせを一括削除")
    void testBulkDeleteSuccess() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3, 4, 5);
        when(mapper.deleteByIds(ids)).thenReturn(5);

        // Act
        int deletedCount = service.execute(ids, OPERATOR_ID);

        // Assert
        assertEquals(5, deletedCount);
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
        when(mapper.deleteByIds(ids)).thenReturn(1);

        // Act
        int deletedCount = service.execute(ids, OPERATOR_ID);

        // Assert
        assertEquals(1, deletedCount);
        verify(mapper, times(1)).deleteByIds(ids);
        verify(logHistoryService, times(1)).execute(
            eq(2), eq(4), eq(null), eq(null), eq(OPERATOR_ID), any(Timestamp.class)
        );
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
        verify(mapper, never()).deleteByIds(any());
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
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
        verify(mapper, never()).deleteByIds(any());
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
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
        verify(mapper, never()).deleteByIds(any());
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("正常系: 削除件数が0の場合、ログ記録をスキップ")
    void testNoItemsDeleted() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3);
        when(mapper.deleteByIds(ids)).thenReturn(0);

        // Act
        int deletedCount = service.execute(ids, OPERATOR_ID);

        // Assert
        assertEquals(0, deletedCount);
        verify(mapper, times(1)).deleteByIds(ids);
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("異常系: マッパーでの削除中に例外発生")
    void testMapperException() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3);
        RuntimeException mapperException = new RuntimeException("Database error");
        when(mapper.deleteByIds(ids)).thenThrow(mapperException);

        // Act & Assert
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> service.execute(ids, OPERATOR_ID)
        );
        assertEquals("Database error", exception.getMessage());
        verify(mapper, times(1)).deleteByIds(ids);
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }
}