import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { HomeClockState } from "@/features/home/hooks/useHomeClock";
import type { HomeClockPanelProps } from "./HomeClockPanel";
import { HomeClockPanel } from "./HomeClockPanel";

describe("HomeClockPanel", () => {
  const baseState: Omit<HomeClockState, "captureTimestamp" | "resetError"> = {
    displayText: "2025年11月02日(日) 09:15:42",
    isoNow: "2025-11-02T09:15:42+09:00",
    status: "ready",
    lastCaptured: undefined,
  };

  const noop = () => "";
  const renderPanel = (
    stateOverrides?: Partial<HomeClockState>,
    variant: HomeClockPanelProps["variant"] = "hero"
  ) =>
    render(
      <HomeClockPanel
        state={{
          ...baseState,
          captureTimestamp: noop,
          resetError: () => void 0,
          ...stateOverrides,
        }}
        variant={variant}
      />
    );

  it("準備完了状態の時計を描画する", () => {
    renderPanel();

    const panel = screen.getByTestId("home-clock-panel");
    expect(panel).toHaveAttribute("aria-live", "polite");
    expect(panel).toHaveAttribute("data-variant", "hero");
    expect(panel).toHaveTextContent("2025年11月02日(日) 09:15:42");
  });

  it("エラー時はフォールバックメッセージを表示する", () => {
    renderPanel({
      displayText: "現在時刻を取得できません。端末時計を確認してください。",
      status: "error",
    });

    const panel = screen.getByTestId("home-clock-panel");
    expect(panel).toHaveTextContent(
      "現在時刻を取得できません。端末時計を確認してください。"
    );
  });

  it("variantを切り替えるとdata属性が変わる", () => {
    renderPanel(undefined, "card");

    expect(screen.getByTestId("home-clock-panel")).toHaveAttribute(
      "data-variant",
      "card"
    );
  });
});
