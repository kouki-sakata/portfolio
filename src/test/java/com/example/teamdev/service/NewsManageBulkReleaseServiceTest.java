package com.example.teamdev.service;

import com.example.teamdev.dto.api.news.NewsBulkPublishRequest;
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
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NewsManageBulkReleaseService単体テスト")
class NewsManageBulkReleaseServiceTest {

    @Mock
    private NewsMapper mapper;

    @Mock
    private LogHistoryRegistrationService logHistoryService;

    @Mock
    private Clock clock;

    @InjectMocks
    private NewsManageBulkReleaseService service;

    private static final Instant FIXED_INSTANT = Instant.parse("2024-01-01T00:00:00Z");
    private static final Integer OPERATOR_ID = 1;

    @BeforeEach
    void setUp() {
        when(clock.instant()).thenReturn(FIXED_INSTANT);
    }

    @Test
    @DisplayName("正常系: 複数のお知らせを一括公開")
    void testBulkPublishUniformSuccess() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3, 4, 5);
        Boolean releaseFlag = true;
        when(mapper.bulkUpdateReleaseFlag(eq(ids), eq(releaseFlag), any(Timestamp.class)))
            .thenReturn(5);

        // Act
        int updatedCount = service.executeUniform(ids, releaseFlag, OPERATOR_ID);

        // Assert
        assertEquals(5, updatedCount);
        verify(mapper, times(1)).bulkUpdateReleaseFlag(eq(ids), eq(releaseFlag), any(Timestamp.class));
        verify(logHistoryService, times(1)).execute(
            eq(2), eq(5), eq(null), eq(null), eq(OPERATOR_ID), any(Timestamp.class)
        );
    }

    @Test
    @DisplayName("正常系: 複数のお知らせを一括非公開")
    void testBulkUnpublishUniformSuccess() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3);
        Boolean releaseFlag = false;
        when(mapper.bulkUpdateReleaseFlag(eq(ids), eq(releaseFlag), any(Timestamp.class)))
            .thenReturn(3);

        // Act
        int updatedCount = service.executeUniform(ids, releaseFlag, OPERATOR_ID);

        // Assert
        assertEquals(3, updatedCount);
        verify(mapper, times(1)).bulkUpdateReleaseFlag(eq(ids), eq(releaseFlag), any(Timestamp.class));
        verify(logHistoryService, times(1)).execute(
            eq(2), eq(5), eq(null), eq(null), eq(OPERATOR_ID), any(Timestamp.class)
        );
    }

    @Test
    @DisplayName("正常系: 個別の公開フラグで一括更新")
    void testBulkUpdateIndividualSuccess() {
        // Arrange
        List<NewsBulkPublishRequest.NewsPublishItem> items = Arrays.asList(
            new NewsBulkPublishRequest.NewsPublishItem(1, true),
            new NewsBulkPublishRequest.NewsPublishItem(2, false),
            new NewsBulkPublishRequest.NewsPublishItem(3, true)
        );
        when(mapper.bulkUpdateReleaseFlagIndividual(eq(items), any(Timestamp.class)))
            .thenReturn(3);

        // Act
        int updatedCount = service.executeIndividual(items, OPERATOR_ID);

        // Assert
        assertEquals(3, updatedCount);
        verify(mapper, times(1)).bulkUpdateReleaseFlagIndividual(eq(items), any(Timestamp.class));
        verify(logHistoryService, times(1)).execute(
            eq(2), eq(5), eq(null), eq(null), eq(OPERATOR_ID), any(Timestamp.class)
        );
    }

    @Test
    @DisplayName("異常系: 空のIDリスト（Uniform）")
    void testEmptyIdListUniform() {
        // Arrange
        List<Integer> ids = Collections.emptyList();

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> service.executeUniform(ids, true, OPERATOR_ID)
        );
        assertEquals("更新対象のIDリストが空です", exception.getMessage());
        verify(mapper, never()).bulkUpdateReleaseFlag(any(), any(), any());
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("異常系: nullのIDリスト（Uniform）")
    void testNullIdListUniform() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> service.executeUniform(null, true, OPERATOR_ID)
        );
        assertEquals("更新対象のIDリストが空です", exception.getMessage());
        verify(mapper, never()).bulkUpdateReleaseFlag(any(), any(), any());
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("異常系: 100件を超えるIDリスト（Uniform）")
    void testExceedMaxBatchSizeUniform() {
        // Arrange
        List<Integer> ids = new java.util.ArrayList<>();
        for (int i = 1; i <= 101; i++) {
            ids.add(i);
        }

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> service.executeUniform(ids, true, OPERATOR_ID)
        );
        assertTrue(exception.getMessage().contains("一度に更新できるのは100件まで"));
        verify(mapper, never()).bulkUpdateReleaseFlag(any(), any(), any());
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("異常系: 空のアイテムリスト（Individual）")
    void testEmptyItemListIndividual() {
        // Arrange
        List<NewsBulkPublishRequest.NewsPublishItem> items = Collections.emptyList();

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> service.executeIndividual(items, OPERATOR_ID)
        );
        assertEquals("更新対象のアイテムリストが空です", exception.getMessage());
        verify(mapper, never()).bulkUpdateReleaseFlagIndividual(any(), any());
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("異常系: nullのアイテムリスト（Individual）")
    void testNullItemListIndividual() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> service.executeIndividual(null, OPERATOR_ID)
        );
        assertEquals("更新対象のアイテムリストが空です", exception.getMessage());
        verify(mapper, never()).bulkUpdateReleaseFlagIndividual(any(), any());
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("異常系: 100件を超えるアイテムリスト（Individual）")
    void testExceedMaxBatchSizeIndividual() {
        // Arrange
        List<NewsBulkPublishRequest.NewsPublishItem> items = new java.util.ArrayList<>();
        for (int i = 1; i <= 101; i++) {
            items.add(new NewsBulkPublishRequest.NewsPublishItem(i, true));
        }

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> service.executeIndividual(items, OPERATOR_ID)
        );
        assertTrue(exception.getMessage().contains("一度に更新できるのは100件まで"));
        verify(mapper, never()).bulkUpdateReleaseFlagIndividual(any(), any());
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("正常系: 更新件数が0の場合、ログ記録をスキップ（Uniform）")
    void testNoItemsUpdatedUniform() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3);
        when(mapper.bulkUpdateReleaseFlag(eq(ids), eq(true), any(Timestamp.class)))
            .thenReturn(0);

        // Act
        int updatedCount = service.executeUniform(ids, true, OPERATOR_ID);

        // Assert
        assertEquals(0, updatedCount);
        verify(mapper, times(1)).bulkUpdateReleaseFlag(eq(ids), eq(true), any(Timestamp.class));
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("正常系: 更新件数が0の場合、ログ記録をスキップ（Individual）")
    void testNoItemsUpdatedIndividual() {
        // Arrange
        List<NewsBulkPublishRequest.NewsPublishItem> items = Arrays.asList(
            new NewsBulkPublishRequest.NewsPublishItem(1, true)
        );
        when(mapper.bulkUpdateReleaseFlagIndividual(eq(items), any(Timestamp.class)))
            .thenReturn(0);

        // Act
        int updatedCount = service.executeIndividual(items, OPERATOR_ID);

        // Assert
        assertEquals(0, updatedCount);
        verify(mapper, times(1)).bulkUpdateReleaseFlagIndividual(eq(items), any(Timestamp.class));
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("異常系: マッパーでの更新中に例外発生（Uniform）")
    void testMapperExceptionUniform() {
        // Arrange
        List<Integer> ids = Arrays.asList(1, 2, 3);
        RuntimeException mapperException = new RuntimeException("Database error");
        when(mapper.bulkUpdateReleaseFlag(eq(ids), eq(true), any(Timestamp.class)))
            .thenThrow(mapperException);

        // Act & Assert
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> service.executeUniform(ids, true, OPERATOR_ID)
        );
        assertEquals("Database error", exception.getMessage());
        verify(mapper, times(1)).bulkUpdateReleaseFlag(eq(ids), eq(true), any(Timestamp.class));
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("異常系: マッパーでの更新中に例外発生（Individual）")
    void testMapperExceptionIndividual() {
        // Arrange
        List<NewsBulkPublishRequest.NewsPublishItem> items = Arrays.asList(
            new NewsBulkPublishRequest.NewsPublishItem(1, true)
        );
        RuntimeException mapperException = new RuntimeException("Database error");
        when(mapper.bulkUpdateReleaseFlagIndividual(eq(items), any(Timestamp.class)))
            .thenThrow(mapperException);

        // Act & Assert
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> service.executeIndividual(items, OPERATOR_ID)
        );
        assertEquals("Database error", exception.getMessage());
        verify(mapper, times(1)).bulkUpdateReleaseFlagIndividual(eq(items), any(Timestamp.class));
        verify(logHistoryService, never()).execute(anyInt(), anyInt(), any(), any(), any(), any());
    }
}