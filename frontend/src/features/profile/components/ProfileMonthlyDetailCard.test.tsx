import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileMonthlyDetailCard } from "@/features/profile/components/ProfileMonthlyDetailCard";
import type { MonthlyAttendanceViewModel } from "@/features/profile/types";

const mockMonthlyData: MonthlyAttendanceViewModel[] = [
  {
    month: "2025-05",
    totalHours: 160,
    overtimeHours: 5,
    lateCount: 0,
    paidLeaveHours: 0,
  },
  {
    month: "2025-06",
    totalHours: 168,
    overtimeHours: 8,
    lateCount: 1,
    paidLeaveHours: 0,
  },
  {
    month: "2025-07",
    totalHours: 155,
    overtimeHours: 3,
    lateCount: 0,
    paidLeaveHours: 16,
  },
];

describe("ProfileMonthlyDetailCard", () => {
  it("月次データをテーブルで表示する", () => {
    render(<ProfileMonthlyDetailCard monthlyData={mockMonthlyData} />);

    expect(screen.getByText("月次詳細")).toBeVisible();
    expect(screen.getByText("2025年5月")).toBeVisible();
    expect(screen.getByText("2025年6月")).toBeVisible();
    expect(screen.getByText("2025年7月")).toBeVisible();
  });

  it("データがない場合は空状態メッセージを表示する", () => {
    render(<ProfileMonthlyDetailCard monthlyData={[]} />);

    expect(screen.getByText("月次データがありません")).toBeVisible();
  });

  it("ローディング中はスケルトンを表示する", () => {
    const { container } = render(
      <ProfileMonthlyDetailCard loading monthlyData={[]} />
    );

    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("勤怠カレンダーボタンが表示される", () => {
    render(<ProfileMonthlyDetailCard monthlyData={mockMonthlyData} />);

    const button = screen.getByRole("button", {
      name: /勤怠カレンダーを見る/,
    });
    expect(button).toBeVisible();
  });

  it("バーチャートのARIA属性が設定されている", () => {
    render(<ProfileMonthlyDetailCard monthlyData={mockMonthlyData} />);

    const chart = screen.getByRole("img", {
      name: "月次勤怠データのバーチャート",
    });
    expect(chart).toBeInTheDocument();
  });

  it("テーブルのcaptionが設定されている", () => {
    const { container } = render(
      <ProfileMonthlyDetailCard monthlyData={mockMonthlyData} />
    );

    const caption = container.querySelector("caption");
    expect(caption).toHaveTextContent(
      "月別勤怠サマリデータ。総労働時間、残業時間、遅刻回数、有給消化時間を含みます。"
    );
  });
});
