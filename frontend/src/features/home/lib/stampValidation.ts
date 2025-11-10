import type { DailyAttendanceSnapshot } from "../types";

/**
 * 打刻バリデーションエラー
 */
export class StampValidationError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly reason: string
  ) {
    super(message);
    this.name = "StampValidationError";
  }
}

/**
 * 退勤打刻のバリデーション
 * 出勤打刻がない場合はエラーをスロー
 */
export function validateDepartureStamp(
  snapshot: DailyAttendanceSnapshot | null | undefined
): void {
  if (!snapshot || snapshot.status === "NOT_ATTENDED") {
    throw new StampValidationError(
      "退勤打刻ができません: 出勤打刻が必要です",
      "退勤打刻",
      "出勤打刻が必要です"
    );
  }

  if (snapshot.status === "FINISHED") {
    throw new StampValidationError(
      "退勤打刻ができません: 既に退勤済みです",
      "退勤打刻",
      "既に退勤済みです"
    );
  }
}

/**
 * 休憩操作のバリデーション
 * 出勤打刻がない場合、または退勤後の場合はエラーをスロー
 */
export function validateBreakToggle(
  snapshot: DailyAttendanceSnapshot | null | undefined
): void {
  if (!snapshot || snapshot.status === "NOT_ATTENDED") {
    throw new StampValidationError(
      "休憩操作ができません: 出勤打刻が必要です",
      "休憩操作",
      "出勤打刻が必要です"
    );
  }

  if (snapshot.status === "FINISHED") {
    throw new StampValidationError(
      "休憩操作ができません: 退勤後は休憩操作できません",
      "休憩操作",
      "退勤後は休憩操作できません"
    );
  }
}

/**
 * 打刻可能かどうかを判定
 */
export function canStampAttendance(
  snapshot: DailyAttendanceSnapshot | null | undefined
): boolean {
  return !snapshot || snapshot.status === "NOT_ATTENDED";
}

/**
 * 退勤打刻可能かどうかを判定
 */
export function canStampDeparture(
  snapshot: DailyAttendanceSnapshot | null | undefined
): boolean {
  return (
    snapshot !== null &&
    snapshot !== undefined &&
    (snapshot.status === "WORKING" || snapshot.status === "ON_BREAK")
  );
}

/**
 * 休憩トグル可能かどうかを判定
 */
export function canToggleBreak(
  snapshot: DailyAttendanceSnapshot | null | undefined
): boolean {
  return (
    snapshot !== null &&
    snapshot !== undefined &&
    (snapshot.status === "WORKING" || snapshot.status === "ON_BREAK")
  );
}
