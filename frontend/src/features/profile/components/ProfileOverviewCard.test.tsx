import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileOverviewCard } from "@/features/profile/components/ProfileOverviewCard";
import type { ExtendedProfileOverviewViewModel } from "@/features/profile/types";

const baseProfile: ExtendedProfileOverviewViewModel = {
  fullName: "坂田 晃輝",
  email: "sakata@example.com",
  employeeNumber: "EMP-0001",
  department: "プロダクト開発部",
  address: "大阪府大阪市北区梅田1-1-1",
  updatedAt: "2025-11-02T12:34:56+09:00",
  activityNote: "React/Javaの担当。フロントとバックの橋渡し。",
  status: "active",
  joinedAt: "2024-07-01",
  manager: "田中 太郎",
  workStyle: "hybrid",
  schedule: {
    start: "09:30",
    end: "18:30",
    breakMinutes: 60,
  },
  location: "大阪/梅田 (JST)",
};

describe("ProfileOverviewCard", () => {
  it("基本プロフィール情報をカード内に整然と表示する", () => {
    render(<ProfileOverviewCard overview={baseProfile} />);

    expect(screen.getByText("坂田 晃輝")).toBeVisible();
    expect(screen.getByText("sakata@example.com")).toBeVisible();
    expect(screen.getAllByText(/プロダクト開発部/)[0]).toBeVisible();
    expect(
      screen.getByText("React/Javaの担当。フロントとバックの橋渡し。")
    ).toBeVisible();
    expect(screen.getByText(/入社.*2024/)).toBeVisible();
    expect(screen.getByText(/上長:.*田中 太郎/)).toBeVisible();
    expect(screen.getByText(/勤務形態:.*ハイブリッド/)).toBeVisible();
    expect(screen.getByText(/就業:.*09:30.*18:30/)).toBeVisible();
    expect(screen.getByText(/大阪\/梅田/)).toBeVisible();
    expect(screen.getByText("稼働中")).toBeVisible();
    expect(screen.getByText(/社員番号:.*EMP-0001/)).toBeVisible();
  });

  it("未設定のフィールドには未設定ラベルを表示する", () => {
    render(
      <ProfileOverviewCard
        overview={{
          ...baseProfile,
          employeeNumber: null,
          manager: null,
          location: "",
          activityNote: "",
        }}
      />
    );

    const placeholders = screen.getAllByText(/未設定/);
    expect(placeholders.length).toBeGreaterThan(0);
  });
});
