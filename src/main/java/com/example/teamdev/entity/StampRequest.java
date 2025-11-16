package com.example.teamdev.entity;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 打刻修正リクエストエンティティ。
 * <p>
 * 今後のMyBatisマッパー実装で利用される予定のフィールド構造を先行して定義しています。
 * </p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StampRequest {

    private Integer id;

    private Integer employeeId;

    private Integer stampHistoryId;

    private LocalDate stampDate;

    // Original values captured at submission time
    private OffsetDateTime originalInTime;

    private OffsetDateTime originalOutTime;

    private OffsetDateTime originalBreakStartTime;

    private OffsetDateTime originalBreakEndTime;

    private Boolean originalIsNightShift;

    // Requested values supplied by the employee
    private OffsetDateTime requestedInTime;

    private OffsetDateTime requestedOutTime;

    private OffsetDateTime requestedBreakStartTime;

    private OffsetDateTime requestedBreakEndTime;

    private Boolean requestedIsNightShift;

    private String reason;

    private String status;

    private String approvalNote;

    private String rejectionReason;

    private String cancellationReason;

    private Integer approvalEmployeeId;

    private Integer rejectionEmployeeId;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    private OffsetDateTime approvedAt;

    private OffsetDateTime rejectedAt;

    private OffsetDateTime cancelledAt;
}
