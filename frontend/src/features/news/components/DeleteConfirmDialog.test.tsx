import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NewsResponse } from "@/types";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  bulkMutateAsync: vi.fn(),
}));

vi.mock("@/features/news/hooks/useNews", () => ({
  useDeleteNewsMutation: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
  useBulkDeleteMutation: () => ({
    mutateAsync: mocks.bulkMutateAsync,
    isPending: false,
  }),
}));

const sampleNews = (overrides?: Partial<NewsResponse>): NewsResponse => ({
  id: 1,
  newsDate: "2025-10-10",
  content: "長いテキスト".repeat(50),
  releaseFlag: false,
  updateDate: "2025-10-10T10:00:00Z",
  ...overrides,
});

describe("DeleteConfirmDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
    mocks.bulkMutateAsync.mockReset();
  });

  it("削除ボタンでダイアログを開き、プレビューを100文字で表示する", async () => {
    const user = userEvent.setup();
    render(<ControlledDeleteConfirmDialog news={sampleNews()} type="single" />);

    await user.click(screen.getByRole("button", { name: "削除" }));

    const description = await screen.findByText((_, element) => {
      if (!element || element.tagName !== "P") {
        return false;
      }
      return Boolean(
        element.textContent?.includes(
          "この操作は取り消せません。削除すると復元できません。"
        )
      );
    });

    const text = description.textContent ?? "";
    const [preview] = text.split("この操作は取り消せません");
    const normalizedPreview = (preview ?? "").trim();

    expect(normalizedPreview.length).toBeLessThanOrEqual(101);
    expect(normalizedPreview.endsWith("…")).toBe(true);
  });

  it("確認ボタンでuseDeleteNewsMutationを呼び出す", async () => {
    const user = userEvent.setup();
    mocks.mutateAsync.mockResolvedValue(undefined);

    const news = sampleNews({ id: 44 });
    render(<ControlledDeleteConfirmDialog news={news} type="single" />);

    await user.click(screen.getByRole("button", { name: "削除" }));
    await user.click(await screen.findByRole("button", { name: "削除する" }));

    expect(mocks.mutateAsync).toHaveBeenCalledWith(news.id);
  });

  it("キャンセルボタンでダイアログを閉じる", async () => {
    const user = userEvent.setup();
    render(<ControlledDeleteConfirmDialog news={sampleNews()} type="single" />);

    await user.click(screen.getByRole("button", { name: "削除" }));

    const cancelButton = await screen.findByRole("button", {
      name: "キャンセル",
    });
    await user.click(cancelButton);

    expect(
      screen.queryByRole("button", { name: "削除する" })
    ).not.toBeInTheDocument();
  });
});
type SingleDialogProps = Extract<
  Parameters<typeof DeleteConfirmDialog>[0],
  { type: "single" }
>;

const ControlledDeleteConfirmDialog = (
  props: Omit<SingleDialogProps, "open" | "onOpenChange">
) => {
  const [open, setOpen] = useState(false);

  return <DeleteConfirmDialog {...props} onOpenChange={setOpen} open={open} />;
};
