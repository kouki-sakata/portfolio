package com.example.teamdev.service;

import com.example.teamdev.constant.StampRequestStatus;
import com.example.teamdev.dto.api.stamprequest.StampRequestCreateRequest;
import com.example.teamdev.entity.StampRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * 打刻修正リクエストの登録を扱うサービス。
 */
@Service
public class StampRequestRegistrationService {

    private final StampRequestStore store;

    public StampRequestRegistrationService(StampRequestStore store) {
        this.store = store;
    }

    public StampRequest createRequest(StampRequestCreateRequest request, Integer employeeId) {
        if (employeeId == null) {
            throw new IllegalArgumentException("社員IDが指定されていません");
        }

        LocalDate stampDate = request.requestedInTime() != null
            ? request.requestedInTime().toLocalDate()
            : store.now().toLocalDate();

        StampRequest stampRequest = StampRequest.builder()
            .employeeId(employeeId)
            .stampHistoryId(request.stampHistoryId())
            .stampDate(stampDate)
            .requestedInTime(request.requestedInTime())
            .requestedOutTime(request.requestedOutTime())
            .requestedBreakStartTime(request.requestedBreakStartTime())
            .requestedBreakEndTime(request.requestedBreakEndTime())
            .requestedIsNightShift(request.requestedIsNightShift())
            .reason(request.reason())
            .status(StampRequestStatus.PENDING.name())
            .build();

        return store.create(stampRequest);
    }
}
