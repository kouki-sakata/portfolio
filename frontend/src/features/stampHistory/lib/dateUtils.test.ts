import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { describe, expect, it } from "vitest";
import {
  combineDateTimeToISO,
  extractTimeFromISO,
  formatSubmittedAt,
  isPastOrToday,
} from "./dateUtils";

dayjs.extend(utc);
dayjs.extend(timezone);

describe("dateUtils", () => {
  describe("isPastOrToday", () => {
    it("should return true for a past date", () => {
      const result = isPastOrToday("2020", "1", "1");
      expect(result).toBe(true);
    });

    it("should return true for today", () => {
      const today = new Date();
      const year = today.getFullYear().toString();
      const month = (today.getMonth() + 1).toString();
      const day = today.getDate().toString();

      const result = isPastOrToday(year, month, day);
      expect(result).toBe(true);
    });

    it("should return false for a future date", () => {
      const result = isPastOrToday("2099", "12", "31");
      expect(result).toBe(false);
    });

    it("should return false when year is null", () => {
      const result = isPastOrToday(null, "1", "1");
      expect(result).toBe(false);
    });

    it("should return false when month is null", () => {
      const result = isPastOrToday("2020", null, "1");
      expect(result).toBe(false);
    });

    it("should return false when day is null", () => {
      const result = isPastOrToday("2020", "1", null);
      expect(result).toBe(false);
    });
  });

  describe("combineDateTimeToISO", () => {
    it("should combine date and time into ISO 8601 format", () => {
      const result = combineDateTimeToISO("2025", "11", "18", "09:00");
      expect(result).toBe("2025-11-18T09:00:00+09:00");
    });

    it("should pad single-digit month and day with zeros", () => {
      const result = combineDateTimeToISO("2025", "1", "5", "09:00");
      expect(result).toBe("2025-01-05T09:00:00+09:00");
    });

    it("should return null for single-digit hours and minutes (invalid format)", () => {
      // HTML input type="time" always returns zero-padded format (HH:mm)
      // so "9:5" is considered invalid
      const result = combineDateTimeToISO("2025", "11", "18", "9:5");
      expect(result).toBeNull();
    });

    it("should handle midnight (00:00)", () => {
      const result = combineDateTimeToISO("2025", "11", "18", "00:00");
      expect(result).toBe("2025-11-18T00:00:00+09:00");
    });

    it("should handle end of day (23:59)", () => {
      const result = combineDateTimeToISO("2025", "11", "18", "23:59");
      expect(result).toBe("2025-11-18T23:59:00+09:00");
    });

    it("should handle noon (12:00)", () => {
      const result = combineDateTimeToISO("2025", "11", "18", "12:00");
      expect(result).toBe("2025-11-18T12:00:00+09:00");
    });

    it("should return null when year is null", () => {
      const result = combineDateTimeToISO(null, "11", "18", "09:00");
      expect(result).toBeNull();
    });

    it("should return null when month is null", () => {
      const result = combineDateTimeToISO("2025", null, "18", "09:00");
      expect(result).toBeNull();
    });

    it("should return null when day is null", () => {
      const result = combineDateTimeToISO("2025", "11", null, "09:00");
      expect(result).toBeNull();
    });

    it("should return null when time is null", () => {
      const result = combineDateTimeToISO("2025", "11", "18", null);
      expect(result).toBeNull();
    });

    it("should return null for invalid time format (missing colon)", () => {
      const result = combineDateTimeToISO("2025", "11", "18", "0900");
      expect(result).toBeNull();
    });

    it("should return null for invalid time format (hours > 23)", () => {
      const result = combineDateTimeToISO("2025", "11", "18", "24:00");
      expect(result).toBeNull();
    });

    it("should return null for invalid time format (minutes > 59)", () => {
      const result = combineDateTimeToISO("2025", "11", "18", "09:60");
      expect(result).toBeNull();
    });

    it("should return null for invalid time format (negative hours)", () => {
      const result = combineDateTimeToISO("2025", "11", "18", "-01:00");
      expect(result).toBeNull();
    });

    it("should return null for invalid time format (letters)", () => {
      const result = combineDateTimeToISO("2025", "11", "18", "ab:cd");
      expect(result).toBeNull();
    });

    it("should handle edge case with already padded values", () => {
      const result = combineDateTimeToISO("2025", "01", "05", "09:05");
      expect(result).toBe("2025-01-05T09:05:00+09:00");
    });

    it("should correctly format break times for stamp requests", () => {
      // Simulating a typical stamp request scenario
      const breakStart = combineDateTimeToISO("2025", "11", "18", "12:00");
      const breakEnd = combineDateTimeToISO("2025", "11", "18", "13:00");

      expect(breakStart).toBe("2025-11-18T12:00:00+09:00");
      expect(breakEnd).toBe("2025-11-18T13:00:00+09:00");
    });

    it("should correctly format in/out times for stamp requests", () => {
      // Simulating a typical stamp request scenario
      const inTime = combineDateTimeToISO("2025", "11", "18", "09:00");
      const outTime = combineDateTimeToISO("2025", "11", "18", "18:00");

      expect(inTime).toBe("2025-11-18T09:00:00+09:00");
      expect(outTime).toBe("2025-11-18T18:00:00+09:00");
    });
  });

  describe("extractTimeFromISO", () => {
    it("should extract time from ISO 8601 string", () => {
      const result = extractTimeFromISO("2025-11-07T09:30:00+09:00");
      expect(result).toBe("09:30");
    });

    it("should extract time with afternoon hours", () => {
      const result = extractTimeFromISO("2025-11-07T14:45:00+09:00");
      expect(result).toBe("14:45");
    });

    it("should handle midnight", () => {
      const result = extractTimeFromISO("2025-11-07T00:00:00+09:00");
      expect(result).toBe("00:00");
    });

    it("should handle end of day", () => {
      const result = extractTimeFromISO("2025-11-07T23:59:00+09:00");
      expect(result).toBe("23:59");
    });

    it("should convert UTC timezone to JST", () => {
      // UTC 00:30 = JST 09:30
      const result = extractTimeFromISO("2025-11-07T00:30:00Z");
      expect(result).toBe("09:30");
    });

    it("should return null for null input", () => {
      const result = extractTimeFromISO(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = extractTimeFromISO(undefined);
      expect(result).toBeNull();
    });

    it("should return null for invalid date string", () => {
      const result = extractTimeFromISO("invalid-date");
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = extractTimeFromISO("");
      expect(result).toBeNull();
    });
  });

  describe("formatSubmittedAt", () => {
    it("should format ISO 8601 string to Japanese datetime format", () => {
      const result = formatSubmittedAt("2025-11-07T19:05:00+09:00");
      expect(result).toBe("2025/11/07 19:05");
    });

    it("should format with morning hours", () => {
      const result = formatSubmittedAt("2025-11-07T09:15:00+09:00");
      expect(result).toBe("2025/11/07 09:15");
    });

    it("should format midnight", () => {
      const result = formatSubmittedAt("2025-11-07T00:00:00+09:00");
      expect(result).toBe("2025/11/07 00:00");
    });

    it("should format end of day", () => {
      const result = formatSubmittedAt("2025-11-07T23:59:00+09:00");
      expect(result).toBe("2025/11/07 23:59");
    });

    it("should convert UTC timezone to JST", () => {
      // UTC 10:05 = JST 19:05
      const result = formatSubmittedAt("2025-11-07T10:05:00Z");
      expect(result).toBe("2025/11/07 19:05");
    });

    it("should handle single-digit month and day", () => {
      const result = formatSubmittedAt("2025-01-05T14:30:00+09:00");
      expect(result).toBe("2025/01/05 14:30");
    });

    it("should return null for null input", () => {
      const result = formatSubmittedAt(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = formatSubmittedAt(undefined);
      expect(result).toBeNull();
    });

    it("should return null for invalid date string", () => {
      const result = formatSubmittedAt("invalid-date");
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = formatSubmittedAt("");
      expect(result).toBeNull();
    });
  });
});
