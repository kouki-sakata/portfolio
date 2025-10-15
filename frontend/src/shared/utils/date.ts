import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 現在のJST時刻を ISO 8601 形式（タイムゾーンオフセット付き）で返す
 *
 * ⚠️ IMPORTANT: Asia/Tokyo タイムゾーンに固定
 * ブラウザのタイムゾーンに関係なく、常にJST（日本標準時）で時刻を取得します。
 * これにより海外からのアクセスでも正しい打刻時刻が記録されます。
 *
 * @returns ISO 8601形式のタイムスタンプ文字列（例: "2025-10-14T12:30:45+09:00"）
 */
export const formatLocalTimestamp = (): string =>
  dayjs().tz("Asia/Tokyo").format();
