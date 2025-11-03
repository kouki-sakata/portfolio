import { describe, expect, it } from "vitest";

import {
  CLOCK_FALLBACK_MESSAGE,
  formatClockDisplay,
  formatClockTime,
} from "../clockFormat";

describe("formatClockDisplay", () => {
  it("指定したISO文字列を日本語の日時表記へ変換する", () => {
    const iso = "2025-11-02T09:15:42+09:00";

    const result = formatClockDisplay(iso);

    expect(result).toBe("2025年11月02日(日) 09:15:42");
  });

  it("無効なISO文字列の場合はエラーを投げる", () => {
    expect(() => formatClockDisplay("invalid")).toThrowError(
      "clock-format-invalid-iso"
    );
  });
});

describe("formatClockTime", () => {
  it("ISO文字列から時刻のみを抽出する", () => {
    const iso = "2025-11-02T09:15:42+09:00";

    expect(formatClockTime(iso)).toBe("09:15:42");
  });

  it("無効なISO文字列の場合はエラーを投げる", () => {
    expect(() => formatClockTime("invalid")).toThrowError(
      "clock-format-invalid-iso"
    );
  });
});

describe("CLOCK_FALLBACK_MESSAGE", () => {
  it("フォールバックメッセージを提供する", () => {
    expect(CLOCK_FALLBACK_MESSAGE).toBe(
      "現在時刻を取得できません。端末時計を確認してください。"
    );
  });
});
