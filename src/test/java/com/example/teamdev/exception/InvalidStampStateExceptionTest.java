package com.example.teamdev.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * InvalidStampStateExceptionのユニットテスト
 */
class InvalidStampStateExceptionTest {

    @Test
    void constructor_shouldSetOperationAndReason() {
        String operation = "退勤打刻";
        String reason = "出勤打刻が必要です";

        InvalidStampStateException exception = new InvalidStampStateException(operation, reason);

        assertEquals(operation, exception.getOperation());
        assertEquals(reason, exception.getReason());
        assertEquals("退勤打刻ができません: 出勤打刻が必要です", exception.getMessage());
    }

    @Test
    void constructor_shouldHandleBreakOperation() {
        String operation = "休憩操作";
        String reason = "出勤打刻が必要です";

        InvalidStampStateException exception = new InvalidStampStateException(operation, reason);

        assertEquals(operation, exception.getOperation());
        assertEquals(reason, exception.getReason());
        assertEquals("休憩操作ができません: 出勤打刻が必要です", exception.getMessage());
    }

    @Test
    void constructor_shouldHandleAfterDepartureReason() {
        String operation = "休憩操作";
        String reason = "退勤後は休憩操作できません";

        InvalidStampStateException exception = new InvalidStampStateException(operation, reason);

        assertEquals(operation, exception.getOperation());
        assertEquals(reason, exception.getReason());
        assertEquals("休憩操作ができません: 退勤後は休憩操作できません", exception.getMessage());
    }

    @Test
    void exception_shouldBeRuntimeException() {
        InvalidStampStateException exception = new InvalidStampStateException("操作", "理由");
        assertTrue(exception instanceof RuntimeException);
    }
}
