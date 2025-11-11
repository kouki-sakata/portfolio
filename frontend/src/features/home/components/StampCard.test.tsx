import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ClockDisplayState } from "@/features/home/hooks/useClockDisplay";
import type { StampStatus } from "@/features/home/hooks/useStamp";

import { StampCard } from "./StampCard";

// useClockDisplayフックをモック
vi.mock("@/features/home/hooks/useClockDisplay", () => ({
  useClockDisplay: vi.fn(),
}));

describe("StampCard", () => {
  const mockUseClockDisplay = vi.fn();

  beforeEach(() => {
    // デフォルトのモック実装
    mockUseClockDisplay.mockReturnValue({
      displayText: "2025年11月02日(日) 09:15:42",
      isoNow: "2025-11-02T09:15:42+09:00",
      status: "ready",
      resetError: vi.fn(),
    } satisfies ClockDisplayState);

    // モックをインポート
    const { useClockDisplay } = vi.mocked(
      await import("@/features/home/hooks/useClockDisplay")
    );
    useClockDisplay.mockImplementation(mockUseClockDisplay);
  });

  it("ボタン押下時に時計からタイムスタンプを取得し、handleStampへ渡す", async () => {
    const user = userEvent.setup();
    const onCaptureTimestamp = vi
      .fn()
      .mockReturnValue("2025-11-02T09:15:42+09:00");
    const onStamp = vi.fn().mockResolvedValue(undefined);

    render(
      <StampCard
        className="test-card"
        isLoading={false}
        onCaptureTimestamp={onCaptureTimestamp}
        onStamp={onStamp}
        snapshot={null}
        status={null}
      />
    );

    await user.click(screen.getByRole("button", { name: /出勤打刻/ }));

    expect(onCaptureTimestamp).toHaveBeenCalledTimes(1);
    expect(onStamp).toHaveBeenCalledWith(
      "1",
      false,
      "2025-11-02T09:15:42+09:00"
    );
  });

  it("成功ステータスが渡された場合、打刻時刻を含むメッセージを表示する", () => {
    const status: StampStatus = {
      message: "出勤打刻が完了しました",
      submittedAt: "2025-11-02T09:15:42+09:00",
      type: "1",
      result: "success",
    };

    render(
      <StampCard
        className="test-card"
        isLoading={false}
        onCaptureTimestamp={() => "2025-11-02T09:15:42+09:00"}
        onStamp={vi.fn()}
        snapshot={null}
        status={status}
      />
    );

    expect(screen.getByText("出勤打刻が完了しました")).toBeInTheDocument();
    expect(screen.getByText(/打刻時刻/)).toHaveTextContent("09:15:42");
  });
});
