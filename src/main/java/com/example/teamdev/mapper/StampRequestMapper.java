package com.example.teamdev.mapper;

import com.example.teamdev.entity.StampRequest;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

/**
 * 打刻修正リクエストテーブル：stamp_request
 */
@Mapper
public interface StampRequestMapper {

    /**
     * IDで1件取得
     */
    @Select("SELECT id, employee_id AS employeeId, stamp_history_id AS stampHistoryId, "
            + "stamp_date AS stampDate, status, "
            + "original_in_time AS originalInTime, original_out_time AS originalOutTime, "
            + "original_break_start_time AS originalBreakStartTime, original_break_end_time AS originalBreakEndTime, "
            + "original_is_night_shift AS originalIsNightShift, "
            + "requested_in_time AS requestedInTime, requested_out_time AS requestedOutTime, "
            + "requested_break_start_time AS requestedBreakStartTime, requested_break_end_time AS requestedBreakEndTime, "
            + "requested_is_night_shift AS requestedIsNightShift, "
            + "reason, approval_note AS approvalNote, rejection_reason AS rejectionReason, "
            + "cancellation_reason AS cancellationReason, "
            + "approval_employee_id AS approvalEmployeeId, rejection_employee_id AS rejectionEmployeeId, "
            + "created_at AS createdAt, updated_at AS updatedAt, "
            + "approved_at AS approvedAt, rejected_at AS rejectedAt, cancelled_at AS cancelledAt "
            + "FROM stamp_request WHERE id = #{id}")
    Optional<StampRequest> findById(@Param("id") Integer id);

    /**
     * 全件取得
     */
    @Select("SELECT id, employee_id AS employeeId, stamp_history_id AS stampHistoryId, "
            + "stamp_date AS stampDate, status, "
            + "original_in_time AS originalInTime, original_out_time AS originalOutTime, "
            + "original_break_start_time AS originalBreakStartTime, original_break_end_time AS originalBreakEndTime, "
            + "original_is_night_shift AS originalIsNightShift, "
            + "requested_in_time AS requestedInTime, requested_out_time AS requestedOutTime, "
            + "requested_break_start_time AS requestedBreakStartTime, requested_break_end_time AS requestedBreakEndTime, "
            + "requested_is_night_shift AS requestedIsNightShift, "
            + "reason, approval_note AS approvalNote, rejection_reason AS rejectionReason, "
            + "cancellation_reason AS cancellationReason, "
            + "approval_employee_id AS approvalEmployeeId, rejection_employee_id AS rejectionEmployeeId, "
            + "created_at AS createdAt, updated_at AS updatedAt, "
            + "approved_at AS approvedAt, rejected_at AS rejectedAt, cancelled_at AS cancelledAt "
            + "FROM stamp_request ORDER BY created_at DESC")
    List<StampRequest> findAll();

    /**
     * 従業員IDで取得（作成日降順）
     */
    @Select("SELECT id, employee_id AS employeeId, stamp_history_id AS stampHistoryId, "
            + "stamp_date AS stampDate, status, "
            + "original_in_time AS originalInTime, original_out_time AS originalOutTime, "
            + "original_break_start_time AS originalBreakStartTime, original_break_end_time AS originalBreakEndTime, "
            + "original_is_night_shift AS originalIsNightShift, "
            + "requested_in_time AS requestedInTime, requested_out_time AS requestedOutTime, "
            + "requested_break_start_time AS requestedBreakStartTime, requested_break_end_time AS requestedBreakEndTime, "
            + "requested_is_night_shift AS requestedIsNightShift, "
            + "reason, approval_note AS approvalNote, rejection_reason AS rejectionReason, "
            + "cancellation_reason AS cancellationReason, "
            + "approval_employee_id AS approvalEmployeeId, rejection_employee_id AS rejectionEmployeeId, "
            + "created_at AS createdAt, updated_at AS updatedAt, "
            + "approved_at AS approvedAt, rejected_at AS rejectedAt, cancelled_at AS cancelledAt "
            + "FROM stamp_request WHERE employee_id = #{employeeId} ORDER BY created_at DESC")
    List<StampRequest> findByEmployeeId(@Param("employeeId") Integer employeeId);

    /**
     * 従業員ID + ステータスで取得
     */
    @Select("SELECT id, employee_id AS employeeId, stamp_history_id AS stampHistoryId, "
            + "stamp_date AS stampDate, status, "
            + "original_in_time AS originalInTime, original_out_time AS originalOutTime, "
            + "original_break_start_time AS originalBreakStartTime, original_break_end_time AS originalBreakEndTime, "
            + "original_is_night_shift AS originalIsNightShift, "
            + "requested_in_time AS requestedInTime, requested_out_time AS requestedOutTime, "
            + "requested_break_start_time AS requestedBreakStartTime, requested_break_end_time AS requestedBreakEndTime, "
            + "requested_is_night_shift AS requestedIsNightShift, "
            + "reason, approval_note AS approvalNote, rejection_reason AS rejectionReason, "
            + "cancellation_reason AS cancellationReason, "
            + "approval_employee_id AS approvalEmployeeId, rejection_employee_id AS rejectionEmployeeId, "
            + "created_at AS createdAt, updated_at AS updatedAt, "
            + "approved_at AS approvedAt, rejected_at AS rejectedAt, cancelled_at AS cancelledAt "
            + "FROM stamp_request WHERE employee_id = #{employeeId} AND status = #{status} "
            + "ORDER BY created_at DESC")
    List<StampRequest> findByEmployeeIdAndStatus(@Param("employeeId") Integer employeeId, @Param("status") String status);

    /**
     * PENDING状態のリクエストを従業員ID + 勤怠履歴IDで検索（重複チェック用）
     */
    @Select("SELECT id, employee_id AS employeeId, stamp_history_id AS stampHistoryId, "
            + "stamp_date AS stampDate, status, "
            + "original_in_time AS originalInTime, original_out_time AS originalOutTime, "
            + "original_break_start_time AS originalBreakStartTime, original_break_end_time AS originalBreakEndTime, "
            + "original_is_night_shift AS originalIsNightShift, "
            + "requested_in_time AS requestedInTime, requested_out_time AS requestedOutTime, "
            + "requested_break_start_time AS requestedBreakStartTime, requested_break_end_time AS requestedBreakEndTime, "
            + "requested_is_night_shift AS requestedIsNightShift, "
            + "reason, approval_note AS approvalNote, rejection_reason AS rejectionReason, "
            + "cancellation_reason AS cancellationReason, "
            + "approval_employee_id AS approvalEmployeeId, rejection_employee_id AS rejectionEmployeeId, "
            + "created_at AS createdAt, updated_at AS updatedAt, "
            + "approved_at AS approvedAt, rejected_at AS rejectedAt, cancelled_at AS cancelledAt "
            + "FROM stamp_request WHERE employee_id = #{employeeId} AND stamp_history_id = #{stampHistoryId} "
            + "AND status = 'PENDING' LIMIT 1")
    Optional<StampRequest> findPendingByEmployeeIdAndStampHistoryId(
            @Param("employeeId") Integer employeeId,
            @Param("stampHistoryId") Integer stampHistoryId
    );

    /**
     * ステータスで取得（作成日降順）
     */
    @Select("SELECT id, employee_id AS employeeId, stamp_history_id AS stampHistoryId, "
            + "stamp_date AS stampDate, status, "
            + "original_in_time AS originalInTime, original_out_time AS originalOutTime, "
            + "original_break_start_time AS originalBreakStartTime, original_break_end_time AS originalBreakEndTime, "
            + "original_is_night_shift AS originalIsNightShift, "
            + "requested_in_time AS requestedInTime, requested_out_time AS requestedOutTime, "
            + "requested_break_start_time AS requestedBreakStartTime, requested_break_end_time AS requestedBreakEndTime, "
            + "requested_is_night_shift AS requestedIsNightShift, "
            + "reason, approval_note AS approvalNote, rejection_reason AS rejectionReason, "
            + "cancellation_reason AS cancellationReason, "
            + "approval_employee_id AS approvalEmployeeId, rejection_employee_id AS rejectionEmployeeId, "
            + "created_at AS createdAt, updated_at AS updatedAt, "
            + "approved_at AS approvedAt, rejected_at AS rejectedAt, cancelled_at AS cancelledAt "
            + "FROM stamp_request WHERE status = #{status} ORDER BY created_at DESC")
    List<StampRequest> findByStatus(@Param("status") String status);

    /**
     * ステータスで取得（ページネーション付き）
     */
    @Select("SELECT id, employee_id AS employeeId, stamp_history_id AS stampHistoryId, "
            + "stamp_date AS stampDate, status, "
            + "original_in_time AS originalInTime, original_out_time AS originalOutTime, "
            + "original_break_start_time AS originalBreakStartTime, original_break_end_time AS originalBreakEndTime, "
            + "original_is_night_shift AS originalIsNightShift, "
            + "requested_in_time AS requestedInTime, requested_out_time AS requestedOutTime, "
            + "requested_break_start_time AS requestedBreakStartTime, requested_break_end_time AS requestedBreakEndTime, "
            + "requested_is_night_shift AS requestedIsNightShift, "
            + "reason, approval_note AS approvalNote, rejection_reason AS rejectionReason, "
            + "cancellation_reason AS cancellationReason, "
            + "approval_employee_id AS approvalEmployeeId, rejection_employee_id AS rejectionEmployeeId, "
            + "created_at AS createdAt, updated_at AS updatedAt, "
            + "approved_at AS approvedAt, rejected_at AS rejectedAt, cancelled_at AS cancelledAt "
            + "FROM stamp_request WHERE status = #{status} ORDER BY created_at DESC "
            + "LIMIT #{limit} OFFSET #{offset}")
    List<StampRequest> findByStatusWithPagination(
            @Param("status") String status,
            @Param("offset") int offset,
            @Param("limit") int limit
    );

    /**
     * ステータス別の件数をカウント
     */
    @Select("SELECT COUNT(*) FROM stamp_request WHERE status = #{status}")
    int countByStatus(@Param("status") String status);

    /**
     * 勤怠履歴IDに紐づく最新のリクエストを取得（バッジ表示用）
     */
    @Select("SELECT id, employee_id AS employeeId, stamp_history_id AS stampHistoryId, "
            + "stamp_date AS stampDate, status, "
            + "original_in_time AS originalInTime, original_out_time AS originalOutTime, "
            + "original_break_start_time AS originalBreakStartTime, original_break_end_time AS originalBreakEndTime, "
            + "original_is_night_shift AS originalIsNightShift, "
            + "requested_in_time AS requestedInTime, requested_out_time AS requestedOutTime, "
            + "requested_break_start_time AS requestedBreakStartTime, requested_break_end_time AS requestedBreakEndTime, "
            + "requested_is_night_shift AS requestedIsNightShift, "
            + "reason, approval_note AS approvalNote, rejection_reason AS rejectionReason, "
            + "cancellation_reason AS cancellationReason, "
            + "approval_employee_id AS approvalEmployeeId, rejection_employee_id AS rejectionEmployeeId, "
            + "created_at AS createdAt, updated_at AS updatedAt, "
            + "approved_at AS approvedAt, rejected_at AS rejectedAt, cancelled_at AS cancelledAt "
            + "FROM stamp_request WHERE stamp_history_id = #{stampHistoryId} "
            + "ORDER BY created_at DESC LIMIT 1")
    Optional<StampRequest> findLatestByStampHistoryId(@Param("stampHistoryId") Integer stampHistoryId);

    /**
     * リクエストを挿入
     */
    void save(StampRequest request);

    /**
     * リクエストを更新
     */
    void update(StampRequest request);

    /**
     * リクエストを削除
     */
    @Delete("DELETE FROM stamp_request WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);
}
