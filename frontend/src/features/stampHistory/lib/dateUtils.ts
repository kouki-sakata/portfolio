/**
 * エントリの日付が現在日付以下（過去または今日）かどうかを判定
 */
export const isPastOrToday = (year: string | null, month: string | null, day: string | null): boolean => {
  if (!year || !month || !day) {
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
