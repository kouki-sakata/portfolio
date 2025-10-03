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

    if (
      inMinutes === undefined ||
      outMinutes === undefined ||
      outMinutes <= inMinutes
    ) {
      continue;
    }

    presentDays += 1;
    totalWorkingHours += (outMinutes - inMinutes) / MINUTES_PER_HOUR;
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
