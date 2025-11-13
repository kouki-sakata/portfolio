package com.example.teamdev.service.stamp;

import com.example.teamdev.dto.StampEditData;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.mapper.StampHistoryMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * StampHistoryPersistenceのテストクラス。
 * StampHistoryMapperをモック化して新規/更新パターンをテストします。
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("StampHistoryPersistence テスト")
class StampHistoryPersistenceTest {

    @Mock
    private StampHistoryMapper stampHistoryMapper;

    @InjectMocks
    private StampHistoryPersistence persistence;

    private OffsetDateTime testInTime;
    private OffsetDateTime testOutTime;
    private static final int UPDATE_EMPLOYEE_ID = 100;

    @BeforeEach
    void setUp() {
        testInTime = OffsetDateTime.of(2025, 10, 1, 9, 0, 0, 0, ZoneOffset.ofHours(9));
        testOutTime = OffsetDateTime.of(2025, 10, 1, 18, 0, 0, 0, ZoneOffset.ofHours(9));
    }

    @Nested
    @DisplayName("saveOrUpdate メソッド - 新規登録")
    class SaveOrUpdateNewEntryTest {

        @Test
        @DisplayName("正常系: 新規打刻履歴が正しく保存される")
        void saveOrUpdate_withNewEntry_shouldSaveCorrectly() {
            // Arrange
            StampEditData data = new StampEditData(
                null, // ID is null for new entry
                200,
                "2025",
                "10",
                "1",
                LocalDate.of(2025, 10, 1),
                "09:00",
                "18:00",
                null,  // breakStartTime
                null,  // breakEndTime
                null   // isNightShift
            );

            ArgumentCaptor<StampHistory> captor = ArgumentCaptor.forClass(StampHistory.class);

            // Act
            boolean result = persistence.saveOrUpdate(data, testInTime, testOutTime, UPDATE_EMPLOYEE_ID);

            // Assert
            assertTrue(result, "保存成功");
            verify(stampHistoryMapper, times(1)).save(captor.capture());

            StampHistory saved = captor.getValue();
            assertAll(
                "保存されたエンティティの検証",
                () -> assertEquals("2025", saved.getYear()),
                () -> assertEquals("10", saved.getMonth()),
                () -> assertEquals("1", saved.getDay()),
                () -> assertEquals(200, saved.getEmployeeId()),
                () -> assertEquals(testInTime, saved.getInTime()),
                () -> assertEquals(testOutTime, saved.getOutTime()),
                () -> assertEquals(UPDATE_EMPLOYEE_ID, saved.getUpdateEmployeeId()),
                () -> assertNotNull(saved.getUpdateDate())
            );
        }

        @Test
        @DisplayName("正常系: 出勤時刻のみの新規登録")
        void saveOrUpdate_withInTimeOnly_shouldSaveCorrectly() {
            // Arrange
            StampEditData data = new StampEditData(
                null,
                150,
                "2025",
                "10",
                "15",
                LocalDate.of(2025, 10, 15),
                "10:00",
                null,
                null,  // breakStartTime
                null,  // breakEndTime
                null   // isNightShift
            );

            ArgumentCaptor<StampHistory> captor = ArgumentCaptor.forClass(StampHistory.class);

            // Act
            boolean result = persistence.saveOrUpdate(data, testInTime, null, UPDATE_EMPLOYEE_ID);

            // Assert
            assertTrue(result);
            verify(stampHistoryMapper).save(captor.capture());

            StampHistory saved = captor.getValue();
            assertAll(
                "出勤時刻のみの保存",
                () -> assertEquals(testInTime, saved.getInTime()),
                () -> assertNull(saved.getOutTime(), "退勤時刻はnull")
            );
        }

        @Test
        @DisplayName("正常系: 退勤時刻のみの新規登録")
        void saveOrUpdate_withOutTimeOnly_shouldSaveCorrectly() {
            // Arrange
            StampEditData data = new StampEditData(
                null,
                250,
                "2025",
                "10",
                "20",
                LocalDate.of(2025, 10, 20),
                null,
                "18:00",
                null,  // breakStartTime
                null,  // breakEndTime
                null   // isNightShift
            );

            ArgumentCaptor<StampHistory> captor = ArgumentCaptor.forClass(StampHistory.class);

            // Act
            boolean result = persistence.saveOrUpdate(data, null, testOutTime, UPDATE_EMPLOYEE_ID);

            // Assert
            assertTrue(result);
            verify(stampHistoryMapper).save(captor.capture());

            StampHistory saved = captor.getValue();
            assertAll(
                "退勤時刻のみの保存",
                () -> assertNull(saved.getInTime(), "出勤時刻はnull"),
                () -> assertEquals(testOutTime, saved.getOutTime())
            );
        }

        @Test
        @DisplayName("正常系: 時刻が両方nullの新規登録")
        void saveOrUpdate_withBothTimesNull_shouldSaveCorrectly() {
            // Arrange
            StampEditData data = new StampEditData(
                null,
                300,
                "2025",
                "10",
                "25",
                LocalDate.of(2025, 10, 25),
                null,
                null,
                null,  // breakStartTime
                null,  // breakEndTime
                null   // isNightShift
            );

            ArgumentCaptor<StampHistory> captor = ArgumentCaptor.forClass(StampHistory.class);

            // Act
            boolean result = persistence.saveOrUpdate(data, null, null, UPDATE_EMPLOYEE_ID);

            // Assert
            assertTrue(result);
            verify(stampHistoryMapper).save(captor.capture());

            StampHistory saved = captor.getValue();
            assertAll(
                "時刻なしの保存",
                () -> assertNull(saved.getInTime()),
                () -> assertNull(saved.getOutTime())
            );
        }
    }

    @Nested
    @DisplayName("saveOrUpdate メソッド - 更新")
    class SaveOrUpdateExistingEntryTest {

        @Test
        @DisplayName("正常系: 既存打刻履歴が正しく更新される")
        void saveOrUpdate_withExistingEntry_shouldUpdateCorrectly() {
            // Arrange
            StampEditData data = new StampEditData(
                999,
                200,
                "2025",
                "10",
                "1",
                LocalDate.of(2025, 10, 1),
                "09:30",
                "18:30",
                null,  // breakStartTime
                null,  // breakEndTime
                null   // isNightShift
            );

            StampHistory existingEntity = new StampHistory();
            existingEntity.setId(999);
            existingEntity.setEmployeeId(200);
            existingEntity.setYear("2025");
            existingEntity.setMonth("10");
            existingEntity.setDay("1");

            when(stampHistoryMapper.getById(999)).thenReturn(Optional.of(existingEntity));

            ArgumentCaptor<StampHistory> updateCaptor = ArgumentCaptor.forClass(StampHistory.class);

            // Act
            boolean result = persistence.saveOrUpdate(data, testInTime, testOutTime, UPDATE_EMPLOYEE_ID);

            // Assert
            assertTrue(result, "更新成功");
            verify(stampHistoryMapper).getById(999);
            verify(stampHistoryMapper).update(updateCaptor.capture());

            StampHistory updated = updateCaptor.getValue();
            assertAll(
                "更新されたエンティティの検証",
                () -> assertEquals(999, updated.getId()),
                () -> assertEquals(testInTime, updated.getInTime()),
                () -> assertEquals(testOutTime, updated.getOutTime()),
                () -> assertEquals(UPDATE_EMPLOYEE_ID, updated.getUpdateEmployeeId()),
                () -> assertNotNull(updated.getUpdateDate())
            );
        }

        @Test
        @DisplayName("正常系: 時刻をnullに更新")
        void saveOrUpdate_updateTimesToNull_shouldUpdateCorrectly() {
            // Arrange
            StampEditData data = new StampEditData(
                888,
                150,
                "2025",
                "10",
                "5",
                LocalDate.of(2025, 10, 5),
                null,
                null,
                null,  // breakStartTime
                null,  // breakEndTime
                null   // isNightShift
            );

            StampHistory existingEntity = new StampHistory();
            existingEntity.setId(888);
            existingEntity.setInTime(testInTime);
            existingEntity.setOutTime(testOutTime);

            when(stampHistoryMapper.getById(888)).thenReturn(Optional.of(existingEntity));

            ArgumentCaptor<StampHistory> captor = ArgumentCaptor.forClass(StampHistory.class);

            // Act
            boolean result = persistence.saveOrUpdate(data, null, null, UPDATE_EMPLOYEE_ID);

            // Assert
            assertTrue(result);
            verify(stampHistoryMapper).update(captor.capture());

            StampHistory updated = captor.getValue();
            assertAll(
                "時刻がnullに更新",
                () -> assertNull(updated.getInTime()),
                () -> assertNull(updated.getOutTime())
            );
        }

        @Test
        @DisplayName("異常系: 存在しないIDで更新しようとした場合はfalseを返す")
        void saveOrUpdate_withNonExistentId_shouldReturnFalse() {
            // Arrange
            StampEditData data = new StampEditData(
                777,
                100,
                "2025",
                "10",
                "10",
                LocalDate.of(2025, 10, 10),
                "09:00",
                "18:00",
                null,  // breakStartTime
                null,  // breakEndTime
                null   // isNightShift
            );

            when(stampHistoryMapper.getById(777)).thenReturn(Optional.empty());

            // Act
            boolean result = persistence.saveOrUpdate(data, testInTime, testOutTime, UPDATE_EMPLOYEE_ID);

            // Assert
            assertFalse(result, "存在しないIDの場合はfalse");
            verify(stampHistoryMapper).getById(777);
            verify(stampHistoryMapper, never()).update(any());
            verify(stampHistoryMapper, never()).save(any());
        }

        @Test
        @DisplayName("正常系: 出勤時刻のみ更新")
        void saveOrUpdate_updateInTimeOnly_shouldUpdateCorrectly() {
            // Arrange
            StampEditData data = new StampEditData(
                666,
                100,
                "2025",
                "10",
                "12",
                LocalDate.of(2025, 10, 12),
                "10:00",
                null,
                null,  // breakStartTime
                null,  // breakEndTime
                null   // isNightShift
            );

            StampHistory existingEntity = new StampHistory();
            existingEntity.setId(666);

            when(stampHistoryMapper.getById(666)).thenReturn(Optional.of(existingEntity));

            ArgumentCaptor<StampHistory> captor = ArgumentCaptor.forClass(StampHistory.class);

            // Act
            boolean result = persistence.saveOrUpdate(data, testInTime, null, UPDATE_EMPLOYEE_ID);

            // Assert
            assertTrue(result);
            verify(stampHistoryMapper).update(captor.capture());

            StampHistory updated = captor.getValue();
            assertAll(
                "出勤時刻のみ更新",
                () -> assertEquals(testInTime, updated.getInTime()),
                () -> assertNull(updated.getOutTime())
            );
        }
    }

    @Nested
    @DisplayName("exists メソッド")
    class ExistsTest {

        @Test
        @DisplayName("正常系: 存在するIDの場合trueを返す")
        void exists_withExistingId_shouldReturnTrue() {
            // Arrange
            Integer id = 100;
            StampHistory entity = new StampHistory();
            when(stampHistoryMapper.getById(id)).thenReturn(Optional.of(entity));

            // Act
            boolean result = persistence.exists(id);

            // Assert
            assertTrue(result, "存在するIDの場合true");
            verify(stampHistoryMapper).getById(id);
        }

        @Test
        @DisplayName("正常系: 存在しないIDの場合falseを返す")
        void exists_withNonExistentId_shouldReturnFalse() {
            // Arrange
            Integer id = 999;
            when(stampHistoryMapper.getById(id)).thenReturn(Optional.empty());

            // Act
            boolean result = persistence.exists(id);

            // Assert
            assertFalse(result, "存在しないIDの場合false");
            verify(stampHistoryMapper).getById(id);
        }

        @Test
        @DisplayName("正常系: IDがnullの場合falseを返す")
        void exists_withNullId_shouldReturnFalse() {
            // Act
            boolean result = persistence.exists(null);

            // Assert
            assertFalse(result, "nullの場合false");
            verify(stampHistoryMapper, never()).getById(any());
        }
    }

    @Nested
    @DisplayName("統合テスト")
    class IntegrationTest {

        @Test
        @DisplayName("新規登録から更新への流れが正しく動作")
        void newEntryThenUpdate_shouldWorkCorrectly() {
            // Arrange - 新規登録
            StampEditData newData = new StampEditData(
                null,
                100,
                "2025",
                "10",
                "1",
                LocalDate.of(2025, 10, 1),
                "09:00",
                null,
                null,  // breakStartTime
                null,  // breakEndTime
                null   // isNightShift
            );

            // Act - 新規保存
            boolean saveResult = persistence.saveOrUpdate(newData, testInTime, null, UPDATE_EMPLOYEE_ID);

            // Assert - 新規保存成功
            assertTrue(saveResult);
            verify(stampHistoryMapper, times(1)).save(any());

            // Arrange - 更新
            StampEditData updateData = new StampEditData(
                500,
                100,
                "2025",
                "10",
                "1",
                LocalDate.of(2025, 10, 1),
                "09:00",
                "18:00",
                null,  // breakStartTime
                null,  // breakEndTime
                null   // isNightShift
            );

            StampHistory existingEntity = new StampHistory();
            existingEntity.setId(500);
            when(stampHistoryMapper.getById(500)).thenReturn(Optional.of(existingEntity));

            // Act - 更新
            boolean updateResult = persistence.saveOrUpdate(updateData, testInTime, testOutTime, UPDATE_EMPLOYEE_ID);

            // Assert - 更新成功
            assertTrue(updateResult);
            verify(stampHistoryMapper).update(any());
        }

        @Test
        @DisplayName("異なる従業員IDでの新規登録が連続して動作")
        void multipleNewEntriesWithDifferentEmployees_shouldWorkCorrectly() {
            // Arrange
            StampEditData data1 = new StampEditData(null, 100, "2025", "10", "1", LocalDate.of(2025, 10, 1), "09:00", "18:00", null, null, null);
            StampEditData data2 = new StampEditData(null, 200, "2025", "10", "2", LocalDate.of(2025, 10, 2), "10:00", "19:00", null, null, null);

            // Act
            boolean result1 = persistence.saveOrUpdate(data1, testInTime, testOutTime, UPDATE_EMPLOYEE_ID);
            boolean result2 = persistence.saveOrUpdate(data2, testInTime, testOutTime, UPDATE_EMPLOYEE_ID);

            // Assert
            assertTrue(result1);
            assertTrue(result2);
            verify(stampHistoryMapper, times(2)).save(any());
        }
    }
}
