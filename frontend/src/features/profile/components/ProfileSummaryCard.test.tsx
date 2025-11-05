import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileSummaryCard } from "@/features/profile/components/ProfileSummaryCard";
import type { AttendanceSummaryViewModel } from "@/features/profile/types";

const mockSummary: AttendanceSummaryViewModel = {
  currentMonth: {
    totalHours: 165,
    overtimeHours: 10,
    lateCount: 0,
    paidLeaveHours: 8,
  },
  trendData: [
    { month: "05", totalHours: 160, overtimeHours: 5 },
    { month: "06", totalHours: 168, overtimeHours: 8 },
    { month: "07", totalHours: 155, overtimeHours: 3 },
    { month: "08", totalHours: 172, overtimeHours: 12 },
    { month: "09", totalHours: 162, overtimeHours: 7 },
    { month: "10", totalHours: 165, overtimeHours: 10 },
  ],
};

describe("ProfileSummaryCard", () => {
  it("統計データを表示する", () => {
    render(<ProfileSummaryCard summary={mockSummary} />);

    expect(screen.getByText("勤怠サマリ")).toBeVisible();
    expect(screen.getByText("165h")).toBeVisible();
    expect(screen.getByText("10h")).toBeVisible();
    expect(screen.getByText("0")).toBeVisible();
    expect(screen.getByText("8h")).toBeVisible();
  });

  it("ローディング中はスケルトンを表示する", () => {
    const { container } = render(<ProfileSummaryCard loading summary={null} />);

    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("データがない場合は空状態メッセージを表示する", () => {
    render(<ProfileSummaryCard summary={null} />);

    expect(screen.getByText("統計データがありません")).toBeVisible();
  });

  it("トレンドグラフのARIA属性が設定されている", () => {
    render(<ProfileSummaryCard summary={mockSummary} />);

    const chart = screen.getByRole("img", {
      name: "直近6か月の勤怠トレンドグラフ",
    });
    expect(chart).toBeInTheDocument();
  });
});
