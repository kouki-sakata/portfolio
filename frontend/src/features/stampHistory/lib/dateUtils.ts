import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TIMEZONE = "Asia/Tokyo";
const TIME_FORMAT = "HH:mm";
const DATETIME_FORMAT = "YYYY/MM/DD HH:mm";

/**
 * エントリの日付が現在日付以下（過去または今日）かどうかを判定
 */
export const isPastOrToday = (
  year: string | null,
  month: string | null,
  day: string | null
): boolean => {
  if (!(year && month && day)) {
    return false;
  }

  const entryDate = new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return entryDate <= today;
};

/**
 * 年月日とHH:mm形式の時刻を組み合わせてISO 8601形式に変換
 * @param year - 年（例: "2025"）
 * @param month - 月（例: "11"）
 * @param day - 日（例: "18"）
 * @param time - HH:mm形式の時刻（例: "09:00"）
 * @returns ISO 8601形式の文字列（例: "2025-11-18T09:00:00+09:00"）、または null
 */
export const combineDateTimeToISO = (
  year: string | null,
  month: string | null,
  day: string | null,
  time: string | null
): string | null => {
  if (!(year && month && day && time)) {
    return null;
  }

  if (!TIME_FORMAT_REGEX.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(":");
  const paddedMonth = month.padStart(2, "0");
  const paddedDay = day.padStart(2, "0");
  const paddedHours = hours?.padStart(2, "0");
  const paddedMinutes = minutes?.padStart(2, "0");

  return `${year}-${paddedMonth}-${paddedDay}T${paddedHours}:${paddedMinutes}:00+09:00`;
};

/**
 * ISO 8601タイムスタンプから時刻部分(HH:mm)を抽出
 * @param isoString - ISO 8601形式の文字列 (例: "2025-11-06T09:00:00+09:00")
 * @returns HH:mm形式の時刻 (例: "09:00") または null
 */
export const extractTimeFromISO = (
  isoString: string | null | undefined
): string | null => {
  if (!isoString) {
    return null;
  }

  const parsed = dayjs(isoString);
  if (!parsed.isValid()) {
    return null;
  }

  return parsed.tz(TIMEZONE).format(TIME_FORMAT);
};

/**
 * ISO 8601タイムスタンプを日本語の日時形式に変換
 * @param isoString - ISO 8601形式の文字列
 * @returns "YYYY/MM/DD HH:mm"形式の文字列 (例: "2025/11/07 19:05") または null
 */
export const formatSubmittedAt = (
  isoString: string | null | undefined
): string | null => {
  if (!isoString) {
    return null;
  }

  const parsed = dayjs(isoString);
  if (!parsed.isValid()) {
    return null;
  }

  return parsed.tz(TIMEZONE).format(DATETIME_FORMAT);
};
