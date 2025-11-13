package com.example.teamdev.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.teamdev.entity.StampHistoryDisplay;
import com.example.teamdev.testconfig.PostgresContainerSupport;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StampHistoryMapperBatchFetchTest extends PostgresContainerSupport {

    @Autowired
    private StampHistoryMapper stampHistoryMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("複数従業員の対象月を1クエリで取得できる")
    void fetchesMonthForMultipleEmployees() {
        int employeeA = insertEmployee(91001, "Batch", "One");
        int employeeB = insertEmployee(91002, "Batch", "Two");

        insertStamp(employeeA, "2025", "03", "01",
                LocalDateTime.of(2025, 3, 1, 8, 0),
                LocalDateTime.of(2025, 3, 1, 17, 0));
        insertStamp(employeeB, "2025", "03", "02",
                LocalDateTime.of(2025, 3, 2, 9, 0),
                LocalDateTime.of(2025, 3, 2, 18, 0));

        List<LocalDate> dates = List.of(
                LocalDate.of(2025, 3, 1),
                LocalDate.of(2025, 3, 2)
        );

        List<StampHistoryDisplay> result = stampHistoryMapper.getStampHistoryByYearMonthEmployeeIds(
                "2025",
                "03",
                List.of(employeeA, employeeB),
                dates
        );

        assertThat(result).hasSize(4);
        assertThat(result)
                .extracting(StampHistoryDisplay::getEmployeeId)
                .containsExactly(employeeA, employeeA, employeeB, employeeB);

        StampHistoryDisplay firstRow = result.get(0);
        assertThat(firstRow.getInTime()).isEqualTo("08:00");
        assertThat(firstRow.getEmployeeName()).isEqualTo("Batch One");

        StampHistoryDisplay gapRow = result.get(2);
        assertThat(gapRow.getId()).isNull();
        assertThat(gapRow.getEmployeeName()).isEqualTo("Batch Two");

        StampHistoryDisplay filledRow = result.get(3);
        assertThat(filledRow.getOutTime()).isEqualTo("18:00");
    }

    private int insertEmployee(int id, String firstName, String lastName) {
        jdbcTemplate.update(
                """
                INSERT INTO employee (id, first_name, last_name, email, password, admin_flag, update_date, profile_metadata)
                VALUES (?, ?, ?, ?, 'password', 0, NOW(), '{}'::jsonb)
                ON CONFLICT (id) DO NOTHING
                """,
                id,
                firstName,
                lastName,
                firstName.toLowerCase() + "." + lastName.toLowerCase() + "@batch.test"
        );
        return id;
    }

    private static final ZoneOffset JST = ZoneOffset.ofHours(9);

    private void insertStamp(int employeeId, String year, String month, String day,
            LocalDateTime inTime, LocalDateTime outTime) {
        jdbcTemplate.update(
                """
                INSERT INTO stamp_history (year, month, day, employee_id, in_time, out_time, update_employee_id, update_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                """,
                year,
                month,
                day,
                employeeId,
                inTime.atOffset(JST),
                outTime.atOffset(JST),
                employeeId
        );
    }
}
