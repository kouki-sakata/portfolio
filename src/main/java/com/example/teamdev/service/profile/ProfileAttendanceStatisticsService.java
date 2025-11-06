package com.example.teamdev.service.profile;

import com.example.teamdev.dto.api.profile.AttendanceSummaryResponse;
import com.example.teamdev.dto.api.profile.MonthlyAttendanceResponse;
import com.example.teamdev.dto.api.profile.ProfileStatisticsResponse;
import com.example.teamdev.entity.StampHistory;
import com.example.teamdev.mapper.StampHistoryMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * プロフィール統計データの計算を行うサービス
 */
@Service
public class ProfileAttendanceStatisticsService {

    private final StampHistoryMapper stampHistoryMapper;

    public ProfileAttendanceStatisticsService(StampHistoryMapper stampHistoryMapper) {
        this.stampHistoryMapper = stampHistoryMapper;
    }

    /**
     * 従業員の勤怠統計データを取得する
     *
     * @param employeeId 従業員ID
     * @return 統計データ
     */
    public ProfileStatisticsResponse getStatistics(int employeeId) {
        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(today);

        // 直近6ヶ月のデータを取得
        List<MonthlyAttendanceData> last6Months = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth targetMonth = currentMonth.minusMonths(i);
            MonthlyAttendanceData data = calculateMonthlyData(employeeId, targetMonth);
            last6Months.add(data);
        }

        // 今月のデータ
        MonthlyAttendanceData currentMonthData = last6Months.get(last6Months.size() - 1);

        // CurrentMonthDataを構築
        AttendanceSummaryResponse.CurrentMonthData currentStats =
            new AttendanceSummaryResponse.CurrentMonthData(
                BigDecimal.valueOf(currentMonthData.totalHours),
                BigDecimal.valueOf(currentMonthData.overtimeHours),
                currentMonthData.lateCount,
                BigDecimal.valueOf(currentMonthData.paidLeaveHours)
            );

        // TrendDataを構築（月の部分のみ "05", "06" 形式）
        List<AttendanceSummaryResponse.MonthlyTrendResponse> trendData = last6Months.stream()
            .map(data -> new AttendanceSummaryResponse.MonthlyTrendResponse(
                String.format("%02d", data.month.getMonthValue()),
                BigDecimal.valueOf(data.totalHours),
                BigDecimal.valueOf(data.overtimeHours)
            ))
            .toList();

        AttendanceSummaryResponse summary = new AttendanceSummaryResponse(currentStats, trendData);

        // Monthly詳細データを構築（"YYYY-MM" 形式）
        List<MonthlyAttendanceResponse> monthly = last6Months.stream()
            .map(data -> new MonthlyAttendanceResponse(
                data.month.format(DateTimeFormatter.ofPattern("yyyy-MM")),
                BigDecimal.valueOf(data.totalHours),
                BigDecimal.valueOf(data.overtimeHours),
                data.lateCount,
                BigDecimal.valueOf(data.paidLeaveHours)
            ))
            .toList();

        return new ProfileStatisticsResponse(summary, monthly);
    }

    /**
     * 月次の勤怠データを計算する
     */
    private MonthlyAttendanceData calculateMonthlyData(int employeeId, YearMonth yearMonth) {
        String year = String.valueOf(yearMonth.getYear());
        String month = String.format("%02d", yearMonth.getMonthValue());

        // その月の全日付を生成
        List<LocalDate> datesInMonth = new ArrayList<>();
        int daysInMonth = yearMonth.lengthOfMonth();
        for (int day = 1; day <= daysInMonth; day++) {
            datesInMonth.add(yearMonth.atDay(day));
        }

        // 打刻データを取得
        List<StampHistory> stampRecords = getStampHistoriesForMonth(
            employeeId, year, month, datesInMonth
        );

        int totalHours = 0;
        int overtimeHours = 0;
        int lateCount = 0;
        int paidLeaveHours = 0;

        // 定時: 9時間 (標準的な労働時間 8h + 休憩1h = 9h在社、実働8h)
        final int STANDARD_WORK_HOURS = 8;
        final int STANDARD_START_HOUR = 9;
        final int STANDARD_START_MINUTE = 0;

        for (StampHistory record : stampRecords) {
            if (record.getInTime() != null && record.getOutTime() != null) {
                OffsetDateTime inTime = record.getInTime();
                OffsetDateTime outTime = record.getOutTime();

                // 労働時間を計算（分単位で計算後、時間に変換）
                long workMinutes = Duration.between(inTime, outTime).toMinutes();

                // 休憩時間を引く（1時間 = 60分）
                long actualWorkMinutes = workMinutes - 60;

                // 時間に変換（切り上げ）
                int dailyHours = (int) Math.ceil(actualWorkMinutes / 60.0);
                totalHours += dailyHours;

                // 残業時間の計算
                if (dailyHours > STANDARD_WORK_HOURS) {
                    overtimeHours += (dailyHours - STANDARD_WORK_HOURS);
                }

                // 遅刻判定（9:00より後の出勤）
                if (inTime.getHour() > STANDARD_START_HOUR ||
                    (inTime.getHour() == STANDARD_START_HOUR && inTime.getMinute() > STANDARD_START_MINUTE)) {
                    lateCount++;
                }
            }
        }

        // TODO: 有給休暇データは別テーブルから取得する必要がある
        // 現時点では0として返す
        paidLeaveHours = 0;

        return new MonthlyAttendanceData(
            yearMonth,
            totalHours,
            overtimeHours,
            lateCount,
            paidLeaveHours
        );
    }

    /**
     * 指定月の打刻データを取得
     */
    private List<StampHistory> getStampHistoriesForMonth(
        int employeeId,
        String year,
        String month,
        List<LocalDate> datesInMonth
    ) {
        List<StampHistory> result = new ArrayList<>();

        for (LocalDate date : datesInMonth) {
            String day = String.format("%02d", date.getDayOfMonth());
            StampHistory record = stampHistoryMapper.getStampHistoryByYearMonthDayEmployeeId(
                year, month, day, employeeId
            );
            if (record != null) {
                result.add(record);
            }
        }

        return result;
    }

    /**
     * 月次勤怠データの内部クラス
     */
    private static class MonthlyAttendanceData {
        final YearMonth month;
        final int totalHours;
        final int overtimeHours;
        final int lateCount;
        final int paidLeaveHours;

        MonthlyAttendanceData(
            YearMonth month,
            int totalHours,
            int overtimeHours,
            int lateCount,
            int paidLeaveHours
        ) {
            this.month = month;
            this.totalHours = totalHours;
            this.overtimeHours = overtimeHours;
            this.lateCount = lateCount;
            this.paidLeaveHours = paidLeaveHours;
        }
    }
}
