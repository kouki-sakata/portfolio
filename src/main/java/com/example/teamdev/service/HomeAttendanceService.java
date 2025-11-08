package com.example.teamdev.service;

import com.example.teamdev.mapper.StampHistoryMapper;
import com.example.teamdev.service.dto.AttendanceStatus;
import com.example.teamdev.service.dto.DailyAttendanceRecord;
import com.example.teamdev.service.dto.DailyAttendanceSnapshot;
import com.example.teamdev.service.profile.ProfileMetadataRepository;
import com.example.teamdev.service.profile.model.ProfileMetadataDocument;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class HomeAttendanceService {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final StampHistoryMapper stampHistoryMapper;
    private final ProfileMetadataRepository profileMetadataRepository;

    public HomeAttendanceService(
        StampHistoryMapper stampHistoryMapper,
        ProfileMetadataRepository profileMetadataRepository
    ) {
        this.stampHistoryMapper = stampHistoryMapper;
        this.profileMetadataRepository = profileMetadataRepository;
    }

    public Optional<DailyAttendanceSnapshot> fetchTodaySnapshot(int employeeId, ZoneId zoneId) {
        LocalDate today = LocalDate.now(zoneId);
        Optional<DailyAttendanceRecord> recordOptional = stampHistoryMapper.selectDailyAttendance(employeeId, today);
        ProfileMetadataDocument metadata = profileMetadataRepository.load(employeeId);

        if (recordOptional.isEmpty()) {
            return Optional.of(new DailyAttendanceSnapshot(
                AttendanceStatus.NOT_ATTENDED,
                null,
                null,
                null,
                null,
                0
            ));
        }

        DailyAttendanceRecord record = recordOptional.get();
        AttendanceStatus status = resolveStatus(record);

        int overtimeMinutes = record.departureTime() != null
            ? OvertimeCalculator.calculateOvertimeMinutes(record, metadata.schedule())
            : 0;

        return Optional.of(new DailyAttendanceSnapshot(
            status,
            format(record.attendanceTime(), zoneId),
            format(record.breakStartTime(), zoneId),
            format(record.breakEndTime(), zoneId),
            format(record.departureTime(), zoneId),
            overtimeMinutes
        ));
    }

    private static AttendanceStatus resolveStatus(DailyAttendanceRecord record) {
        if (record.attendanceTime() == null) {
            return AttendanceStatus.NOT_ATTENDED;
        }
        if (record.departureTime() != null) {
            return AttendanceStatus.FINISHED;
        }
        if (record.breakStartTime() != null && record.breakEndTime() == null) {
            return AttendanceStatus.ON_BREAK;
        }
        return AttendanceStatus.WORKING;
    }

    private static String format(OffsetDateTime time, ZoneId zoneId) {
        if (time == null) {
            return null;
        }
        return time.atZoneSameInstant(zoneId).toOffsetDateTime().format(ISO_FORMATTER);
    }
}
