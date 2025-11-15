package com.example.teamdev.mapper;

import com.example.teamdev.testconfig.PostgresContainerSupport;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * StampRequestMapper テストの共通基底クラス。
 *
 * <p>テストデータ挿入用のヘルパーメソッドを提供します。</p>
 */
public abstract class StampRequestMapperTestBase extends PostgresContainerSupport {

    @Autowired
    protected StampRequestMapper stampRequestMapper;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    protected static final ZoneOffset JST = ZoneOffset.ofHours(9);

    /**
     * テスト用の従業員を挿入
     *
     * @param id 従業員ID
     * @param firstName 名
     * @param lastName 姓
     * @return 挿入された従業員ID
     */
    protected int insertEmployee(int id, String firstName, String lastName) {
        jdbcTemplate.update(
                """
                INSERT INTO employee (id, first_name, last_name, email, password, admin_flag, update_date, profile_metadata)
                VALUES (?, ?, ?, ?, 'password', 0, NOW(), '{}'::jsonb)
                ON CONFLICT (id) DO NOTHING
                """,
                id,
                firstName,
                lastName,
                firstName.toLowerCase() + "." + lastName.toLowerCase() + "@test.com"
        );
        return id;
    }

    /**
     * テスト用の勤怠履歴を挿入
     *
     * @param employeeId 従業員ID
     * @param date 対象日
     * @return 挿入された勤怠履歴ID
     */
    protected int insertStampHistory(int employeeId, LocalDate date) {
        Integer id = jdbcTemplate.queryForObject(
                """
                INSERT INTO stamp_history (stamp_date, year, month, day, employee_id, update_employee_id, update_date)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
                RETURNING id
                """,
                Integer.class,
                date,
                String.format("%04d", date.getYear()),
                String.format("%02d", date.getMonthValue()),
                String.format("%02d", date.getDayOfMonth()),
                employeeId,
                employeeId
        );
        return id != null ? id : 0;
    }

    /**
     * テスト用の打刻修正リクエストを挿入
     *
     * @param employeeId 従業員ID
     * @param stampHistoryId 勤怠履歴ID
     * @param stampDate 対象日
     * @param status ステータス
     * @param reason 理由
     * @return 挿入されたリクエストID
     */
    protected int insertStampRequest(
            int employeeId,
            int stampHistoryId,
            LocalDate stampDate,
            String status,
            String reason
    ) {
        Integer id = jdbcTemplate.queryForObject(
                """
                INSERT INTO stamp_request (
                    employee_id, stamp_history_id, stamp_date, status,
                    requested_in_time, requested_is_night_shift, reason,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?::stamp_request_status, ?, ?, ?, NOW(), NOW())
                RETURNING id
                """,
                Integer.class,
                employeeId,
                stampHistoryId,
                stampDate,
                status,
                OffsetDateTime.of(stampDate.getYear(), stampDate.getMonthValue(), stampDate.getDayOfMonth(), 9, 0, 0, 0, JST),
                false,
                reason
        );
        return id != null ? id : 0;
    }
}
