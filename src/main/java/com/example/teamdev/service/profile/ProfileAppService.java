package com.example.teamdev.service.profile;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.entity.MonthlyAttendanceStats;
import com.example.teamdev.mapper.StampHistoryMapper;
import com.example.teamdev.service.EmployeeQueryService;
import com.example.teamdev.service.profile.model.ProfileActivityPage;
import com.example.teamdev.service.profile.model.ProfileActivityQuery;
import com.example.teamdev.service.profile.model.ProfileAggregate;
import com.example.teamdev.service.profile.model.ProfileChangeSet;
import com.example.teamdev.service.profile.model.ProfileEmployeeSummary;
import com.example.teamdev.service.profile.model.ProfileMetadataDocument;
import com.example.teamdev.service.profile.model.ProfileMetadataUpdateCommand;
import com.example.teamdev.service.profile.model.ProfileWorkScheduleDocument;
import com.example.teamdev.service.profile.model.ProfileStatisticsData;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * プロフィール取得・更新のアプリケーションサービス。
 */
@Service
public class ProfileAppService {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final EmployeeQueryService employeeQueryService;
    private final ProfileMetadataRepository metadataRepository;
    private final ProfileActivityQueryService activityQueryService;
    private final ProfileAuditService auditService;
    private final StampHistoryMapper stampHistoryMapper;
    private final Clock clock;

    public ProfileAppService(
        EmployeeQueryService employeeQueryService,
        ProfileMetadataRepository metadataRepository,
        ProfileActivityQueryService activityQueryService,
        ProfileAuditService auditService,
        StampHistoryMapper stampHistoryMapper,
        Clock clock
    ) {
        this.employeeQueryService = employeeQueryService;
        this.metadataRepository = metadataRepository;
        this.activityQueryService = activityQueryService;
        this.auditService = auditService;
        this.stampHistoryMapper = stampHistoryMapper;
        this.clock = clock;
    }

    public ProfileAggregate loadSelfProfile(int employeeId) {
        Employee employee = requireEmployee(employeeId);
        ProfileMetadataDocument metadata = metadataRepository.load(employeeId);
        auditService.recordView(employeeId, employeeId);
        return new ProfileAggregate(toSummary(employee, null), metadata);
    }

    public ProfileAggregate loadProfileForAdmin(int targetEmployeeId, int operatorId) {
        Employee operator = requireEmployee(operatorId);
        Employee target = requireEmployee(targetEmployeeId);
        enforceAccess(operator, target, true);
        ProfileMetadataDocument metadata = metadataRepository.load(targetEmployeeId);
        auditService.recordView(operatorId, targetEmployeeId);
        return new ProfileAggregate(toSummary(target, null), metadata);
    }

    public ProfileAggregate updateMetadata(int operatorId, int targetEmployeeId, ProfileMetadataUpdateCommand command) {
        Objects.requireNonNull(command, "command must not be null");
        Employee operator = requireEmployee(operatorId);
        Employee target = requireEmployee(targetEmployeeId);
        enforceAccess(operator, target, false);

        ProfileMetadataDocument before = metadataRepository.load(targetEmployeeId);
        ProfileMetadataDocument updatedDocument = merge(before, command);
        Timestamp now = Timestamp.from(clock.instant());
        metadataRepository.save(targetEmployeeId, updatedDocument, now);

        ProfileChangeSet changeSet = computeChangeSet(before, updatedDocument);
        auditService.recordUpdate(operatorId, targetEmployeeId, changeSet, now.toInstant());

        return new ProfileAggregate(toSummary(target, now.toInstant()), updatedDocument);
    }

    public ProfileActivityPage listActivities(int operatorId, int targetEmployeeId, ProfileActivityQuery query) {
        Employee operator = requireEmployee(operatorId);
        Employee target = requireEmployee(targetEmployeeId);
        enforceAccess(operator, target, false);
        ProfileActivityQuery effectiveQuery = query != null
            ? query
            : new ProfileActivityQuery(0, 20, Optional.empty(), Optional.empty());
        return activityQueryService.fetch(targetEmployeeId, effectiveQuery);
    }

    /**
     * プロフィール統計データを取得する。
     * 直近6ヶ月の勤怠統計を計算する。
     *
     * @param operatorId 操作者ID
     * @param targetEmployeeId 対象従業員ID
     * @return 統計データ
     */
    public ProfileStatisticsData getProfileStatistics(int operatorId, int targetEmployeeId) {
        Employee operator = requireEmployee(operatorId);
        Employee target = requireEmployee(targetEmployeeId);
        enforceAccess(operator, target, false);

        // 直近6ヶ月の範囲を計算
        YearMonth currentMonth = YearMonth.now(clock);
        YearMonth startMonth = currentMonth.minusMonths(5);

        String startMonthStr = startMonth.toString(); // "YYYY-MM"
        String endMonthStr = currentMonth.toString();

        // DBから月次統計を取得
        List<MonthlyAttendanceStats> stats = stampHistoryMapper.findMonthlyStatistics(
            targetEmployeeId, startMonthStr, endMonthStr
        );

        return buildStatisticsData(stats, currentMonth);
    }

    private ProfileStatisticsData buildStatisticsData(
        List<MonthlyAttendanceStats> stats,
        YearMonth currentMonth
    ) {
        // 当月データを抽出
        MonthlyAttendanceStats currentStats = stats.stream()
            .filter(s -> s.getMonth().equals(currentMonth.toString()))
            .findFirst()
            .orElse(new MonthlyAttendanceStats(
                currentMonth.toString(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0
            ));

        // トレンドデータを構築（直近6ヶ月）
        List<ProfileStatisticsData.MonthlyTrendData> trend = stats.stream()
            .map(s -> new ProfileStatisticsData.MonthlyTrendData(
                s.getMonth(),
                s.getTotalHours(),
                s.getOvertimeHours()
            ))
            .toList();

        // サマリーデータを構築
        ProfileStatisticsData.AttendanceSummaryData summary =
            new ProfileStatisticsData.AttendanceSummaryData(
                currentStats.getTotalHours(),
                currentStats.getOvertimeHours(),
                currentStats.getLateCount(),
                BigDecimal.ZERO, // 有給消化は現在未実装のため0
                trend
            );

        // 月次データを構築
        List<ProfileStatisticsData.MonthlyAttendanceData> monthly = stats.stream()
            .map(s -> new ProfileStatisticsData.MonthlyAttendanceData(
                s.getMonth(),
                s.getTotalHours(),
                s.getOvertimeHours(),
                s.getLateCount(),
                BigDecimal.ZERO // 有給消化は現在未実装のため0
            ))
            .toList();

        return new ProfileStatisticsData(summary, monthly);
    }

    private Employee requireEmployee(int employeeId) {
        return employeeQueryService.getById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found for id=" + employeeId));
    }

    private void enforceAccess(Employee operator, Employee target, boolean allowAdminOnly) {
        if (operator.getId().equals(target.getId())) {
            return;
        }
        boolean operatorIsAdmin = operator.getAdminFlag() != null
            && operator.getAdminFlag() == AppConstants.Employee.ADMIN_FLAG_ADMIN;
        if (!operatorIsAdmin) {
            throw new org.springframework.security.access.AccessDeniedException(
                "Access denied: operator does not have permission for target profile"
            );
        }
        if (allowAdminOnly && target.getId().equals(operator.getId())) {
            return;
        }
    }

    private ProfileMetadataDocument merge(ProfileMetadataDocument current, ProfileMetadataUpdateCommand command) {
        ProfileWorkScheduleDocument schedule = command.schedule() != null
            ? new ProfileWorkScheduleDocument(
                defaultString(command.schedule().start(), current.schedule().start()),
                defaultString(command.schedule().end(), current.schedule().end()),
                command.schedule().breakMinutes() >= 0
                    ? command.schedule().breakMinutes()
                    : current.schedule().breakMinutes()
            )
            : current.schedule();

        return new ProfileMetadataDocument(
            defaultString(command.address(), current.address()),
            defaultString(command.department(), current.department()),
            defaultString(command.employeeNumber(), current.employeeNumber()),
            defaultString(command.activityNote(), current.activityNote()),
            defaultString(command.location(), current.location()),
            defaultString(command.manager(), current.manager()),
            defaultString(command.workStyle(), current.workStyle()),
            schedule,
            defaultString(command.status(), current.status()),
            defaultString(command.joinedAt(), current.joinedAt()),
            defaultString(command.avatarUrl(), current.avatarUrl())
        );
    }

    private ProfileChangeSet computeChangeSet(ProfileMetadataDocument before, ProfileMetadataDocument after) {
        Map<String, String> beforeForm = toFormMap(before);
        Map<String, String> afterForm = toFormMap(after);
        List<String> changed = new ArrayList<>();
        Map<String, String> beforeSnapshot = new LinkedHashMap<>();
        Map<String, String> afterSnapshot = new LinkedHashMap<>();

        for (String key : beforeForm.keySet()) {
            String beforeValue = beforeForm.get(key);
            String afterValue = afterForm.get(key);
            if (!Objects.equals(beforeValue, afterValue)) {
                changed.add(key);
                beforeSnapshot.put(key, toNullable(beforeValue));
                afterSnapshot.put(key, toNullable(afterValue));
            }
        }

        String summary = changed.isEmpty()
            ? "プロフィールを更新"
            : String.join("・", changed) + "を更新";

        return new ProfileChangeSet(changed, beforeSnapshot, afterSnapshot, summary);
    }

    private Map<String, String> toFormMap(ProfileMetadataDocument document) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("address", normalize(document.address()));
        values.put("department", normalize(document.department()));
        values.put("employeeNumber", normalize(document.employeeNumber()));
        values.put("activityNote", normalize(document.activityNote()));
        values.put("location", normalize(document.location()));
        values.put("manager", normalize(document.manager()));
        values.put("workStyle", normalize(document.workStyle()));
        values.put("status", normalize(document.status()));
        values.put("joinedAt", normalize(document.joinedAt()));
        values.put("avatarUrl", normalize(document.avatarUrl()));
        values.put("scheduleStart", normalize(document.schedule().start()));
        values.put("scheduleEnd", normalize(document.schedule().end()));
        values.put("scheduleBreakMinutes", Integer.toString(document.schedule().breakMinutes()));
        return values;
    }

    private static String normalize(String value) {
        return value != null ? value : "";
    }

    private static String toNullable(String value) {
        return StringUtils.hasText(value) ? value : null;
    }

    private static String defaultString(String candidate, String fallback) {
        if (candidate == null) {
            return fallback;
        }
        return candidate;
    }

    private ProfileEmployeeSummary toSummary(Employee employee, Instant overrideUpdatedAt) {
        String fullName = String.format(Locale.JAPANESE, "%s %s",
            safe(employee.getLastName()),
            safe(employee.getFirstName())
        ).trim();
        boolean admin = employee.getAdminFlag() != null
            && employee.getAdminFlag() == AppConstants.Employee.ADMIN_FLAG_ADMIN;
        Instant updated = overrideUpdatedAt != null
            ? overrideUpdatedAt
            : employee.getUpdateDate() != null
                ? employee.getUpdateDate().toInstant()
                : clock.instant();
        String formatted = ISO_FORMATTER.format(updated.atOffset(ZoneOffset.UTC));
        return new ProfileEmployeeSummary(
            employee.getId(),
            fullName,
            employee.getEmail(),
            admin,
            formatted
        );
    }

    private static String safe(String value) {
        return value != null ? value : "";
    }
}
