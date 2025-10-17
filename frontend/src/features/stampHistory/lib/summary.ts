import type {
  MonthlyStats,
  StampHistoryEntry,
} from "@/features/stampHistory/types";

const MINUTES_PER_HOUR = 60;

const roundToSingleDecimal = (value: number): number =>
  Math.round(value * 10) / 10;

const toMinutes = (time: string | null | undefined): number | undefined => {
  if (!time) {
    return;
  }

  const [hoursPart, minutesPart] = time.split(":");
  const hours = Number.parseInt(hoursPart ?? "", 10);
  const minutes = Number.parseInt(minutesPart ?? "", 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return;
  }

  return hours * MINUTES_PER_HOUR + minutes;
};

export const calculateMonthlySummary = (
  entries: StampHistoryEntry[]
): MonthlyStats => {
  if (entries.length === 0) {
    return {
      totalWorkingDays: 0,
      presentDays: 0,
      absentDays: 0,
      totalWorkingHours: 0,
      averageWorkingHours: 0,
    };
  }

  let totalWorkingHours = 0;
  let presentDays = 0;

  for (const entry of entries) {
    const inMinutes = toMinutes(entry.inTime);
    const outMinutes = toMinutes(entry.outTime);

    if (inMinutes === undefined || outMinutes === undefined) {
      continue;
    }

    presentDays += 1;

    // 日跨ぎ勤務の処理
    // 退勤時刻が出勤時刻より早い場合は翌日とみなす
    // 例: 18:00(1080分) → 翌03:00(180分) = (1440-1080)+180 = 540分(9時間)
    let workingMinutes: number;
    if (outMinutes < inMinutes) {
      // 日をまたぐ勤務（夜勤など）
      workingMinutes = 1440 - inMinutes + outMinutes;
    } else {
      // 通常勤務（同日内）
      workingMinutes = outMinutes - inMinutes;
    }

    // 異常値チェック（0分以下または24時間超）
    if (workingMinutes <= 0 || workingMinutes > 1440) {
      presentDays -= 1; // カウントを戻す
      continue;
    }

    totalWorkingHours += workingMinutes / MINUTES_PER_HOUR;
  }

  const totalWorkingDays = entries.length;
  const absentDays = totalWorkingDays - presentDays;
  const averageWorkingHours =
    presentDays > 0 ? totalWorkingHours / presentDays : 0;

  return {
    totalWorkingDays,
    presentDays,
    absentDays,
    totalWorkingHours: roundToSingleDecimal(totalWorkingHours),
    averageWorkingHours: roundToSingleDecimal(averageWorkingHours),
  };
};
