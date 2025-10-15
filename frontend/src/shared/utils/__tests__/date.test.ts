import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { describe, expect, it, vi } from "vitest";

import { formatLocalTimestamp } from "../date";

dayjs.extend(utc);
dayjs.extend(timezone);

describe("date utilities", () => {
  describe("formatLocalTimestamp", () => {
    it("returns timestamp in ISO 8601 format with timezone offset", () => {
      const timestamp = formatLocalTimestamp();
      expect(timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/
      );
    });

    it("returns JST timestamp with +09:00 offset regardless of system timezone", () => {
      // 固定時刻でテスト: 2025-10-14 12:30:45 JST
      const fixedTime = "2025-10-14T12:30:45";
      const fixedDate = dayjs.tz(fixedTime, "Asia/Tokyo").valueOf();

      vi.useFakeTimers();
      vi.setSystemTime(fixedDate);

      const timestamp = formatLocalTimestamp();
      expect(timestamp).toBe("2025-10-14T12:30:45+09:00");

      vi.useRealTimers();
    });

    it("uses Asia/Tokyo timezone explicitly with +09:00 offset", () => {
      // 異なるタイムゾーンでも JST を返すことを確認
      // UTC midnight (00:00:00) = JST 09:00:00
      const utcMidnight = dayjs.utc("2025-10-14T00:00:00").valueOf();

      vi.useFakeTimers();
      vi.setSystemTime(utcMidnight);

      const timestamp = formatLocalTimestamp();
      expect(timestamp).toBe("2025-10-14T09:00:00+09:00");

      vi.useRealTimers();
    });

    it("returns current JST time when called without mock", () => {
      const timestamp = formatLocalTimestamp();
      const parsed = dayjs(timestamp);

      // 妥当な範囲の時刻であることを確認（2025年以降）
      expect(parsed.isValid()).toBe(true);
      expect(parsed.year()).toBeGreaterThanOrEqual(2025);
    });
  });
});
