import dayjs from "dayjs";
import "dayjs/locale/ja";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ja");

export const CLOCK_FALLBACK_MESSAGE =
  "現在時刻を取得できません。端末時計を確認してください。";

const DISPLAY_FORMAT = "YYYY年MM月DD日(dd) HH:mm:ss";
const TIME_FORMAT = "HH:mm:ss";
const TIMEZONE = "Asia/Tokyo";
const INVALID_ISO_ERROR = "clock-format-invalid-iso";

const parseIso = (iso: string) => {
  const parsed = dayjs(iso);

  if (!parsed.isValid()) {
    throw new Error(INVALID_ISO_ERROR);
  }
  return parsed.tz(TIMEZONE);
};

export const formatClockDisplay = (iso: string): string =>
  parseIso(iso).format(DISPLAY_FORMAT);

export const formatClockTime = (iso: string): string =>
  parseIso(iso).format(TIME_FORMAT);
