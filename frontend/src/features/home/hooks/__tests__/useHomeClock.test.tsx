import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { formatClockDisplayMock, formatLocalTimestampMock } = vi.hoisted(() => ({
  formatClockDisplayMock: vi.fn((iso: string) => `formatted:${iso}`),
  formatLocalTimestampMock: vi.fn(),
}));

vi.mock("@/features/home/lib/clockFormat", () => ({
  formatClockDisplay: formatClockDisplayMock,
  CLOCK_FALLBACK_MESSAGE:
    "現在時刻を取得できません。端末時計を確認してください。",
}));

vi.mock("@/shared/utils/date", () => ({
  formatLocalTimestamp: formatLocalTimestampMock,
}));

import { useHomeClock } from "../useHomeClock";

describe("useHomeClock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    formatClockDisplayMock.mockImplementation(
      (iso: string) => `formatted:${iso}`
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it("初期化時に現在時刻を取得し、1秒ごとに更新する", () => {
    const isoSequence = [
      "2025-11-02T09:15:42+09:00",
      "2025-11-02T09:15:43+09:00",
    ];
    formatLocalTimestampMock.mockImplementation(() => {
      const next = isoSequence.shift();
      return next ?? "2025-11-02T09:15:43+09:00";
    });

    const { result } = renderHook(() => useHomeClock());

    expect(result.current.status).toBe("ready");
    expect(result.current.isoNow).toBe("2025-11-02T09:15:42+09:00");
    expect(result.current.displayText).toBe(
      "formatted:2025-11-02T09:15:42+09:00"
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isoNow).toBe("2025-11-02T09:15:43+09:00");
    expect(result.current.displayText).toBe(
      "formatted:2025-11-02T09:15:43+09:00"
    );
  });

  it("captureTimestampで最新のISO時刻を取得し、lastCapturedに保持する", () => {
    formatLocalTimestampMock.mockReturnValue("2025-11-02T09:15:42+09:00");

    const { result } = renderHook(() => useHomeClock());

    let captured = "";
    act(() => {
      captured = result.current.captureTimestamp();
    });

    expect(captured).toBe("2025-11-02T09:15:42+09:00");
    expect(result.current.lastCaptured).toBe("2025-11-02T09:15:42+09:00");
  });

  it("フォーマットが失敗した場合はフォールバック表示に切り替え、回復後に自動復旧する", () => {
    const iso = "2025-11-02T09:15:42+09:00";
    formatLocalTimestampMock.mockReturnValue(iso);
    formatClockDisplayMock
      .mockImplementationOnce(() => {
        throw new Error("format-error");
      })
      .mockImplementation((value: string) => `formatted:${value}`);

    const { result } = renderHook(() => useHomeClock());

    expect(result.current.status).toBe("error");
    expect(result.current.displayText).toBe(
      "現在時刻を取得できません。端末時計を確認してください。"
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.displayText).toBe(`formatted:${iso}`);
  });
});
