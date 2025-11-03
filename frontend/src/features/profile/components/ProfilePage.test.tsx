import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { sampleStatistics } from "@/features/profile/mocks/profileStatistics";
import type {
  ExtendedProfileOverviewViewModel,
  ProfileActivityEntryViewModel,
  ProfileMetadataFormValues,
} from "@/features/profile/types";

const overview: ExtendedProfileOverviewViewModel = {
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

const metadata: ProfileMetadataFormValues = {
  address: overview.address ?? "",
  department: overview.department ?? "",
  employeeNumber: overview.employeeNumber ?? "",
  activityNote: overview.activityNote ?? "",
  location: overview.location,
  manager: overview.manager ?? "",
  workStyle: overview.workStyle,
  scheduleStart: overview.schedule.start,
  scheduleEnd: overview.schedule.end,
  scheduleBreakMinutes: overview.schedule.breakMinutes,
};

const activity: ProfileActivityEntryViewModel[] = [
  {
    id: "1",
    occurredAt: "2025-11-02T09:30:00+09:00",
    actor: "坂田 晃輝",
    operationType: "UPDATE",
    summary: "住所を更新",
    changedFields: ["address"],
    beforeSnapshot: { address: "大阪府大阪市北区梅田1-1-1" },
    afterSnapshot: { address: "東京都千代田区丸の内1-1-1" },
  },
];

describe("ProfilePage", () => {
  it("ロード中はスケルトンを表示する", () => {
    render(
      <ProfilePage
        activity={{
          entries: [],
          loading: true,
          page: 0,
          pageSize: 10,
          totalCount: 0,
        }}
        loadingOverview
        metadata={metadata}
        onMetadataSubmit={vi.fn()}
        overview={null}
        statistics={null}
      />
    );

    expect(screen.getByTestId("profile-page-skeleton")).toBeVisible();
  });

  it("編集ボタンでフォームを表示し送信イベントを伝播する", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ProfilePage
        activity={{
          entries: activity,
          loading: false,
          page: 0,
          pageSize: 10,
          totalCount: 1,
        }}
        metadata={metadata}
        onMetadataSubmit={handleSubmit}
        overview={overview}
        statistics={sampleStatistics}
      />
    );

    await user.click(screen.getByRole("button", { name: "編集" }));
    expect(
      await screen.findByRole("form", { name: "プロフィール編集フォーム" })
    ).toBeVisible();

    await user.clear(screen.getByLabelText("部署"));
    await user.type(screen.getByLabelText("部署"), "開発推進部");
    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ department: "開発推進部" })
      );
    });
  });

  it("統計データが提供されている場合はサマリカードを表示する", () => {
    render(
      <ProfilePage
        activity={{
          entries: [],
          loading: false,
          page: 0,
          pageSize: 10,
          totalCount: 0,
        }}
        metadata={metadata}
        onMetadataSubmit={vi.fn()}
        overview={overview}
        statistics={sampleStatistics}
      />
    );

    expect(screen.getByText("勤怠サマリ")).toBeVisible();
    expect(screen.getByText("月次詳細")).toBeVisible();
  });
});
