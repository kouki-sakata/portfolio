package com.example.teamdev.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 月次勤怠統計データ
 * MyBatisクエリ結果用のエンティティ
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyAttendanceStats {
    /**
     * 年月（YYYY-MM形式）
     */
    private String month;

    /**
     * 総労働時間（時間）
     */
    private BigDecimal totalHours;

    /**
     * 残業時間（時間）
     */
    private BigDecimal overtimeHours;

    /**
     * 遅刻回数
     */
    private Integer lateCount;
}
