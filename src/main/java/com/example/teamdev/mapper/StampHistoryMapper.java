package com.example.teamdev.mapper;

import com.example.teamdev.entity.MonthlyAttendanceStats;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.entity.StampHistoryDisplay;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

/**
 * 打刻記録テーブル：stamp_history
 */
@Mapper
public interface StampHistoryMapper {
    //打刻記録テーブルから年・月・日・従業員IDが一致するレコードを取得する
    //※重複するレコードは存在しない前提のため1件取得
    @Select("SELECT id, year, month, day, employee_id AS employeeId, in_time AS inTime, "
            + "out_time AS outTime, update_employee_id AS updateEmployeeId, update_date AS updateDate "
            + "FROM stamp_history WHERE year = #{year} AND month = #{month} AND day = #{day} "
            + "AND employee_id = #{employee_id} LIMIT 1")
    StampHistory getStampHistoryByYearMonthDayEmployeeId(String year,
            String month, String day, int employee_id);

    //対象年月、対象従業員IDの打刻記録情報を取得する
    //対象年月の日数分行を取得したいので、MySQLのSQL文でカレンダーテーブル（generated_dates）を作成し、右外部結合する
    List<StampHistoryDisplay> getStampHistoryByYearMonthEmployeeId(
            @Param("year") String year,
            @Param("month") String month,
            @Param("employeeId") int employeeId,
            @Param("datesInMonth") List<java.time.LocalDate> datesInMonth
    );

    //指定のidで1レコードを取得する
    @Select("SELECT id, year, month, day, employee_id AS employeeId, in_time AS inTime, "
            + "out_time AS outTime, update_employee_id AS updateEmployeeId, update_date AS updateDate "
            + "FROM stamp_history WHERE id = #{id}")
    Optional<StampHistory> getById(@Param("id") Integer id);

    @Delete("DELETE FROM stamp_history WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);

    //打刻記録テーブルにレコードを挿入する
    void save(StampHistory entity);

    // 追加：打刻記録テーブルのレコードを更新する
    void update(StampHistory entity);

    /**
     * 指定期間の月次勤怠統計を取得する
     * @param employeeId 従業員ID
     * @param startMonth 開始年月（YYYY-MM形式）
     * @param endMonth 終了年月（YYYY-MM形式）
     * @return 月次勤怠統計のリスト
     */
    List<MonthlyAttendanceStats> findMonthlyStatistics(
            @Param("employeeId") int employeeId,
            @Param("startMonth") String startMonth,
            @Param("endMonth") String endMonth
    );
}
