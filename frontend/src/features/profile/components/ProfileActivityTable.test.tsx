import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ProfileActivityEntryViewModel } from "@/features/profile/types";
import { ProfileActivityTable } from "@/features/profile/components/ProfileActivityTable";

const activityEntries: ProfileActivityEntryViewModel[] = [
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
  {
    id: "2",
    occurredAt: "2025-11-01T18:15:00+09:00",
    actor: "坂田 晃輝",
    operationType: "VIEW",
    summary: "プロフィールを閲覧",
    changedFields: [],
    beforeSnapshot: {},
    afterSnapshot: {},
  },
];

describe("ProfileActivityTable", () => {
  it("操作履歴を表示し行クリックで詳細を展開する", async () => {
    const user = userEvent.setup();

    render(
      <ProfileActivityTable
        entries={activityEntries}
        page={0}
        pageSize={10}
        totalCount={activityEntries.length}
      />
    );

    expect(screen.getAllByText("住所を更新")[0]).toBeVisible();
    expect(screen.getAllByText("プロフィールを閲覧")[0]).toBeVisible();

    await user.click(screen.getAllByText("住所を更新")[0]);

    expect(
      await screen.findByText("変更された項目")
    ).toBeVisible();
    expect(
      screen.getByText("大阪府大阪市北区梅田1-1-1", { exact: false })
    ).toBeVisible();
    expect(
      screen.getByText("東京都千代田区丸の内1-1-1", { exact: false })
    ).toBeVisible();
  });

  it("データがない場合は空状態メッセージを表示する", () => {
    render(
      <ProfileActivityTable entries={[]} page={0} pageSize={10} totalCount={0} />
    );

    expect(screen.getByText("活動履歴はまだありません")).toBeVisible();
  });

  it("ローディング中はスケルトンを表示する", () => {
    render(
      <ProfileActivityTable
        entries={[]}
        loading
        page={0}
        pageSize={10}
        totalCount={0}
      />
    );

    expect(screen.getByTestId("profile-activity-skeleton")).toBeVisible();
  });

  it("ページネーション操作時にコールバックを発火する", async () => {
    const user = userEvent.setup();
    const handlePagination = vi.fn();

    render(
      <ProfileActivityTable
        entries={Array.from({ length: 12 }, (_, index) => ({
          ...activityEntries[0],
          id: `${index}`,
          occurredAt: `2025-11-0${(index % 5) + 1}T09:00:00+09:00`,
          summary: `更新 ${index}`,
        }))}
        onPaginationChange={handlePagination}
        page={0}
        pageSize={5}
        totalCount={12}
      />
    );

    const nextButtons = screen.getAllByRole("button", { name: "次のページへ" });
    expect(nextButtons.length).toBeGreaterThan(0);
    const nextButton = nextButtons[0];
    await user.click(nextButton);

    expect(handlePagination).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 5 });
  });
});
