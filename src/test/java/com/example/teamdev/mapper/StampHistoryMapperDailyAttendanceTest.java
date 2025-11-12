package com.example.teamdev.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.teamdev.service.dto.DailyAttendanceRecord;
import com.example.teamdev.testconfig.PostgresContainerSupport;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
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
class StampHistoryMapperDailyAttendanceTest extends PostgresContainerSupport {

    @Autowired
    private StampHistoryMapper stampHistoryMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @DisplayName("selectDailyAttendance は休憩列を含めて取得する")
    @Test
    void selectDailyAttendanceIncludesBreaks() {
        int employeeId = insertEmployee();
        OffsetDateTime in = OffsetDateTime.of(2025, 11, 7, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime breakStart = in.plusHours(4);
        OffsetDateTime breakEnd = breakStart.plusMinutes(45);
        OffsetDateTime out = in.plusHours(10);

        jdbcTemplate.update(
            "INSERT INTO stamp_history (year, month, day, employee_id, in_time, out_time, break_start_time, break_end_time, is_night_shift, update_employee_id, update_date) "
                + "VALUES ('2025', '11', '07', ?, ?, ?, ?, ?, ?, ?, ?)",
            employeeId,
            Timestamp.from(in.toInstant()),
            Timestamp.from(out.toInstant()),
            Timestamp.from(breakStart.toInstant()),
            Timestamp.from(breakEnd.toInstant()),
            null,  // is_night_shift
            employeeId,
            Timestamp.from(OffsetDateTime.now().toInstant())
        );

        Optional<DailyAttendanceRecord> record = stampHistoryMapper.selectDailyAttendance(employeeId, in.toLocalDate());

        assertThat(record).isPresent();
        assertThat(record.get().breakStartTime()).isEqualTo(breakStart);
        assertThat(record.get().breakEndTime()).isEqualTo(breakEnd);
    }

    private int insertEmployee() {
        jdbcTemplate.update(
            """
            INSERT INTO employee (id, first_name, last_name, email, password, admin_flag, update_date, profile_metadata)
            VALUES (9998, 'Daily', 'Tester', 'daily@test.com', 'password', 0, NOW(), '{"schedule": {"start": "09:00", "end": "18:00", "breakMinutes": "60"}}'::jsonb)
            ON CONFLICT (id) DO NOTHING
            """
        );
        return jdbcTemplate.queryForObject("SELECT id FROM employee WHERE email = ?", Integer.class, "daily@test.com");
    }
}
