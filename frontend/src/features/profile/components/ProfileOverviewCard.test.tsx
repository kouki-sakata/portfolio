import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import type { ProfileOverviewViewModel } from "@/features/profile/types";
import { ProfileOverviewCard } from "@/features/profile/components/ProfileOverviewCard";

const baseProfile: ProfileOverviewViewModel = {
  fullName: "坂田 晃輝",
  email: "sakata@example.com",
  employeeNumber: "EMP-0001",
  department: "プロダクト開発部",
  address: "大阪府大阪市北区梅田1-1-1",
  updatedAt: "2025-11-02T12:34:56+09:00",
  activityNote: "React/Javaの担当。フロントとバックの橋渡し。",
};

describe("ProfileOverviewCard", () => {
  it("基本プロフィール情報をカード内に整然と表示する", () => {
    render(
      <ProfileOverviewCard
        onEdit={vi.fn()}
        overview={baseProfile}
        variant="standard"
      />
    );

    expect(screen.getByRole("heading", { name: "プロフィール" })).toBeVisible();
    expect(screen.getByText("坂田 晃輝")).toBeVisible();
    expect(screen.getByText("sakata@example.com")).toBeVisible();
    expect(screen.getByText("EMP-0001")).toBeVisible();
    expect(screen.getByText("プロダクト開発部")).toBeVisible();
    expect(screen.getByText("大阪府大阪市北区梅田1-1-1")).toBeVisible();
    expect(screen.getByText("React/Javaの担当。フロントとバックの橋渡し。")).toBeVisible();
    expect(
      screen.getByText("最終更新: 2025年11月02日 12:34")
    ).toBeVisible();
  });

  it("未設定のフィールドには未設定ラベルと案内を表示する", () => {
    render(
      <ProfileOverviewCard
        onEdit={vi.fn()}
        overview={{
          ...baseProfile,
          employeeNumber: null,
          department: "",
          address: null,
          activityNote: "",
        }}
        variant="standard"
      />
    );

    const placeholders = screen.getAllByText("未設定");
    expect(placeholders).toHaveLength(3);
    expect(
      screen.getByText("プロフィール編集から登録できます。")
    ).toBeVisible();
  });
});
