import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { HomeClockState } from "@/features/home/hooks/useHomeClock";
import type { StampStatus } from "@/features/home/hooks/useStamp";

import { StampCard } from "./StampCard";

describe("StampCard", () => {
  const clockState: HomeClockState = {
    displayText: "2025年11月02日(日) 09:15:42",
    isoNow: "2025-11-02T09:15:42+09:00",
    status: "ready",
    lastCaptured: undefined,
    captureTimestamp: () => "2025-11-02T09:15:42+09:00",
    resetError: vi.fn(),
  };

  it("ボタン押下時に時計からタイムスタンプを取得し、handleStampへ渡す", async () => {
    const user = userEvent.setup();
    const onCaptureTimestamp = vi
      .fn()
      .mockReturnValue("2025-11-02T09:15:42+09:00");
    const onStamp = vi.fn().mockResolvedValue(undefined);

    render(
      <StampCard
        className="test-card"
        clockState={clockState}
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
        clockState={clockState}
        isLoading={false}
        onCaptureTimestamp={() => clockState.isoNow}
        onStamp={vi.fn()}
        snapshot={null}
        status={status}
      />
    );

    expect(screen.getByText("出勤打刻が完了しました")).toBeInTheDocument();
    expect(screen.getByText(/打刻時刻/)).toHaveTextContent("09:15:42");
  });
});
