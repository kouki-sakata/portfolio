import { describe, expect, it } from "vitest";
import type { DailyAttendanceSnapshot } from "../../types";
import {
  canStampAttendance,
  canStampDeparture,
  canToggleBreak,
  StampValidationError,
  validateAttendanceStamp,
  validateBreakToggle,
  validateDepartureStamp,
} from "../stampValidation";

describe("stampValidation", () => {
  describe("validateAttendanceStamp", () => {
    it("退勤済みの場合はエラーをスロー", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "FINISHED",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: null,
        breakEndTime: null,
        departureTime: "2025-11-10T18:00:00+09:00",
        overtimeMinutes: 0,
      };

      expect(() => validateAttendanceStamp(snapshot)).toThrow(
        StampValidationError
      );
      expect(() => validateAttendanceStamp(snapshot)).toThrow(
        "出勤打刻ができません: 本日の勤務は既に終了しています"
      );
    });

    it("未出勤の場合はエラーをスローしない", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "NOT_ATTENDED",
        attendanceTime: null,
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(() => validateAttendanceStamp(snapshot)).not.toThrow();
    });

    it("snapshotがnullの場合はエラーをスローしない", () => {
      expect(() => validateAttendanceStamp(null)).not.toThrow();
    });

    it("snapshotがundefinedの場合はエラーをスローしない", () => {
      expect(() => validateAttendanceStamp(undefined)).not.toThrow();
    });

    it("勤務中の場合はエラーをスロー", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "WORKING",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(() => validateAttendanceStamp(snapshot)).toThrow(
        StampValidationError
      );
      expect(() => validateAttendanceStamp(snapshot)).toThrow(
        "出勤打刻ができません: 既に出勤済みです"
      );
    });

    it("休憩中の場合はエラーをスロー", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "ON_BREAK",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: "2025-11-10T12:00:00+09:00",
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(() => validateAttendanceStamp(snapshot)).toThrow(
        StampValidationError
      );
      expect(() => validateAttendanceStamp(snapshot)).toThrow(
        "出勤打刻ができません: 既に出勤済みです"
      );
    });
  });

  describe("validateDepartureStamp", () => {
    it("未出勤の場合はエラーをスロー", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "NOT_ATTENDED",
        attendanceTime: null,
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(() => validateDepartureStamp(snapshot)).toThrow(
        StampValidationError
      );
      expect(() => validateDepartureStamp(snapshot)).toThrow(
        "退勤打刻ができません: 出勤打刻が必要です"
      );
    });

    it("snapshotがnullの場合はエラーをスロー", () => {
      expect(() => validateDepartureStamp(null)).toThrow(StampValidationError);
      expect(() => validateDepartureStamp(null)).toThrow(
        "退勤打刻ができません: 出勤打刻が必要です"
      );
    });

    it("snapshotがundefinedの場合はエラーをスロー", () => {
      expect(() => validateDepartureStamp(undefined)).toThrow(
        StampValidationError
      );
    });

    it("既に退勤済みの場合はエラーをスロー", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "FINISHED",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: null,
        breakEndTime: null,
        departureTime: "2025-11-10T18:00:00+09:00",
        overtimeMinutes: 0,
      };

      expect(() => validateDepartureStamp(snapshot)).toThrow(
        StampValidationError
      );
      expect(() => validateDepartureStamp(snapshot)).toThrow(
        "退勤打刻ができません: 既に退勤済みです"
      );
    });

    it("勤務中の場合はエラーをスローしない", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "WORKING",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(() => validateDepartureStamp(snapshot)).not.toThrow();
    });

    it("休憩中の場合はエラーをスローしない", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "ON_BREAK",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: "2025-11-10T12:00:00+09:00",
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(() => validateDepartureStamp(snapshot)).not.toThrow();
    });
  });

  describe("validateBreakToggle", () => {
    it("未出勤の場合はエラーをスロー", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "NOT_ATTENDED",
        attendanceTime: null,
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(() => validateBreakToggle(snapshot)).toThrow(StampValidationError);
      expect(() => validateBreakToggle(snapshot)).toThrow(
        "休憩操作ができません: 出勤打刻が必要です"
      );
    });

    it("snapshotがnullの場合はエラーをスロー", () => {
      expect(() => validateBreakToggle(null)).toThrow(StampValidationError);
      expect(() => validateBreakToggle(null)).toThrow(
        "休憩操作ができません: 出勤打刻が必要です"
      );
    });

    it("snapshotがundefinedの場合はエラーをスロー", () => {
      expect(() => validateBreakToggle(undefined)).toThrow(
        StampValidationError
      );
    });

    it("退勤済みの場合はエラーをスロー", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "FINISHED",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: null,
        breakEndTime: null,
        departureTime: "2025-11-10T18:00:00+09:00",
        overtimeMinutes: 0,
      };

      expect(() => validateBreakToggle(snapshot)).toThrow(StampValidationError);
      expect(() => validateBreakToggle(snapshot)).toThrow(
        "休憩操作ができません: 退勤後は休憩操作できません"
      );
    });

    it("勤務中の場合はエラーをスローしない", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "WORKING",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(() => validateBreakToggle(snapshot)).not.toThrow();
    });

    it("休憩中の場合はエラーをスローしない", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "ON_BREAK",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: "2025-11-10T12:00:00+09:00",
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(() => validateBreakToggle(snapshot)).not.toThrow();
    });
  });

  describe("canStampAttendance", () => {
    it("snapshotがnullの場合はtrue", () => {
      expect(canStampAttendance(null)).toBe(true);
    });

    it("snapshotがundefinedの場合はtrue", () => {
      expect(canStampAttendance(undefined)).toBe(true);
    });

    it("未出勤の場合はtrue", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "NOT_ATTENDED",
        attendanceTime: null,
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(canStampAttendance(snapshot)).toBe(true);
    });

    it("勤務中の場合はfalse", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "WORKING",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(canStampAttendance(snapshot)).toBe(false);
    });

    it("休憩中の場合はfalse", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "ON_BREAK",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: "2025-11-10T12:00:00+09:00",
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(canStampAttendance(snapshot)).toBe(false);
    });

    it("退勤済みの場合はfalse", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "FINISHED",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: null,
        breakEndTime: null,
        departureTime: "2025-11-10T18:00:00+09:00",
        overtimeMinutes: 0,
      };

      expect(canStampAttendance(snapshot)).toBe(false);
    });
  });

  describe("canStampDeparture", () => {
    it("snapshotがnullの場合はfalse", () => {
      expect(canStampDeparture(null)).toBe(false);
    });

    it("snapshotがundefinedの場合はfalse", () => {
      expect(canStampDeparture(undefined)).toBe(false);
    });

    it("未出勤の場合はfalse", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "NOT_ATTENDED",
        attendanceTime: null,
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(canStampDeparture(snapshot)).toBe(false);
    });

    it("勤務中の場合はtrue", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "WORKING",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(canStampDeparture(snapshot)).toBe(true);
    });

    it("休憩中の場合はtrue", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "ON_BREAK",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: "2025-11-10T12:00:00+09:00",
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(canStampDeparture(snapshot)).toBe(true);
    });

    it("退勤済みの場合はfalse", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "FINISHED",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: null,
        breakEndTime: null,
        departureTime: "2025-11-10T18:00:00+09:00",
        overtimeMinutes: 0,
      };

      expect(canStampDeparture(snapshot)).toBe(false);
    });
  });

  describe("canToggleBreak", () => {
    it("snapshotがnullの場合はfalse", () => {
      expect(canToggleBreak(null)).toBe(false);
    });

    it("snapshotがundefinedの場合はfalse", () => {
      expect(canToggleBreak(undefined)).toBe(false);
    });

    it("未出勤の場合はfalse", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "NOT_ATTENDED",
        attendanceTime: null,
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(canToggleBreak(snapshot)).toBe(false);
    });

    it("勤務中の場合はtrue", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "WORKING",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(canToggleBreak(snapshot)).toBe(true);
    });

    it("休憩中の場合はtrue", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "ON_BREAK",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: "2025-11-10T12:00:00+09:00",
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: null,
      };

      expect(canToggleBreak(snapshot)).toBe(true);
    });

    it("退勤済みの場合はfalse", () => {
      const snapshot: DailyAttendanceSnapshot = {
        status: "FINISHED",
        attendanceTime: "2025-11-10T09:00:00+09:00",
        breakStartTime: null,
        breakEndTime: null,
        departureTime: "2025-11-10T18:00:00+09:00",
        overtimeMinutes: 0,
      };

      expect(canToggleBreak(snapshot)).toBe(false);
    });
  });

  describe("StampValidationError", () => {
    it("正しいプロパティを持つ", () => {
      const error = new StampValidationError(
        "テストメッセージ",
        "操作名",
        "理由"
      );

      expect(error.message).toBe("テストメッセージ");
      expect(error.operation).toBe("操作名");
      expect(error.reason).toBe("理由");
      expect(error.name).toBe("StampValidationError");
      expect(error instanceof Error).toBe(true);
    });
  });
});
