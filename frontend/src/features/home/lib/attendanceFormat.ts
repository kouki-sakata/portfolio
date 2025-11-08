import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "Asia/Tokyo";
const TIME_FORMAT = "HH:mm";

export const formatAttendanceTime = (
  iso: string | null | undefined
): string | null => {
  if (!iso) {
    return null;
  }

  const parsed = dayjs(iso);
  if (!parsed.isValid()) {
    return null;
  }

  return parsed.tz(TIMEZONE).format(TIME_FORMAT);
};

export const formatOvertimeMinutes = (
  minutes: number | null | undefined
): string => {
  if (minutes === null || minutes === undefined) {
    return "未登録";
  }

  if (Number.isNaN(minutes)) {
    return "未登録";
  }

  if (minutes <= 0) {
    return "0分";
  }

  return `${minutes}分`;
};
