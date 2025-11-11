import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ClockDisplayState,
  useClockDisplay,
} from "@/features/home/hooks/useClockDisplay";
import type { HomeClockPanelProps } from "./HomeClockPanel";
import { HomeClockPanel } from "./HomeClockPanel";

// useClockDisplayフックをモック
vi.mock("@/features/home/hooks/useClockDisplay", () => ({
  useClockDisplay: vi.fn(),
}));

describe("HomeClockPanel", () => {
  const mockUseClockDisplay = vi.fn();

  beforeEach(() => {
    // デフォルトのモック実装
    mockUseClockDisplay.mockReturnValue({
      displayText: "2025年11月02日(日) 09:15:42",
      isoNow: "2025-11-02T09:15:42+09:00",
      status: "ready",
      resetError: vi.fn(),
    } satisfies ClockDisplayState);

    vi.mocked(useClockDisplay).mockImplementation(mockUseClockDisplay);
  });

  const renderPanel = (variant: HomeClockPanelProps["variant"] = "hero") =>
    render(<HomeClockPanel variant={variant} />);

  it("準備完了状態の時計を描画する", () => {
    renderPanel();

    const panel = screen.getByTestId("home-clock-panel");
    expect(panel).toHaveAttribute("aria-live", "polite");
    expect(panel).toHaveAttribute("data-variant", "hero");
    expect(panel).toHaveTextContent("2025年11月02日(日) 09:15:42");
  });

  it("エラー時はフォールバックメッセージを表示する", () => {
    mockUseClockDisplay.mockReturnValue({
      displayText: "現在時刻を取得できません。端末時計を確認してください。",
      isoNow: "",
      status: "error",
      resetError: vi.fn(),
    } satisfies ClockDisplayState);

    renderPanel();

    const panel = screen.getByTestId("home-clock-panel");
    expect(panel).toHaveTextContent(
      "現在時刻を取得できません。端末時計を確認してください。"
    );
  });

  it("variantを切り替えるとdata属性が変わる", () => {
    renderPanel("card");

    expect(screen.getByTestId("home-clock-panel")).toHaveAttribute(
      "data-variant",
      "card"
    );
  });
});
