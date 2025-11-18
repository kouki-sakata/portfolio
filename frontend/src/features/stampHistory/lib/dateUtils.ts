// HH:mm形式のバリデーション用正規表現
const TIME_FORMAT_REGEX = /^([0-1]\d|2[0-3]):[0-5]\d$/;

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
 * 年月日とHH:mm形式の時刻を組み合わせてISO 8601形式のタイムスタンプに変換
 * @param year 年（例: "2025"）
 * @param month 月（例: "11"）
 * @param day 日（例: "18"）
 * @param time 時刻（HH:mm形式、例: "09:15"）
 * @returns ISO 8601形式のタイムスタンプ（例: "2025-11-18T09:15:00+09:00"）
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

  // HH:mm形式のバリデーション
  if (!TIME_FORMAT_REGEX.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(":");

  // ISO 8601形式で組み立て（日本時間 +09:00）
  const paddedMonth = month.padStart(2, "0");
  const paddedDay = day.padStart(2, "0");
  const paddedHours = hours?.padStart(2, "0");
  const paddedMinutes = minutes?.padStart(2, "0");

  return `${year}-${paddedMonth}-${paddedDay}T${paddedHours}:${paddedMinutes}:00+09:00`;
};
