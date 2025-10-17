import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NewsResponse } from "@/types";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

const mocks = vi.hoisted(() => ({
  deleteAsync: vi.fn(),
  bulkDeleteAsync: vi.fn(),
}));

vi.mock("@/features/news/hooks/useNews", () => ({
  useDeleteNewsMutation: () => ({
    mutateAsync: mocks.deleteAsync,
    isPending: false,
  }),
  useBulkDeleteMutation: () => ({
    mutateAsync: mocks.bulkDeleteAsync,
    isPending: false,
  }),
}));

const sampleNews = (overrides?: Partial<NewsResponse>): NewsResponse => ({
  id: overrides?.id ?? 1,
  newsDate: overrides?.newsDate ?? "2025-10-10",
  title: overrides?.title ?? "削除対象のお知らせ",
  content: overrides?.content ?? "長いテキスト".repeat(50),
  category: overrides?.category ?? "一般",
  releaseFlag: overrides?.releaseFlag ?? false,
  updateDate: overrides?.updateDate ?? "2025-10-10T10:00:00Z",
});

describe("DeleteConfirmDialog", () => {
  beforeEach(() => {
    mocks.deleteAsync.mockReset();
    mocks.bulkDeleteAsync.mockReset();
  });

  describe("single delete mode", () => {
    it("ダイアログが開いている時、プレビューを100文字で表示する", () => {
      render(
        <DeleteConfirmDialog
          news={sampleNews()}
          onOpenChange={vi.fn()}
          open={true}
          type="single"
        />
      );

      const description = screen.getByText((_, element) => {
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
      mocks.deleteAsync.mockResolvedValue(undefined);
      const onOpenChange = vi.fn();

      const news = sampleNews({ id: 44 });
      render(
        <DeleteConfirmDialog
          news={news}
          onOpenChange={onOpenChange}
          open={true}
          type="single"
        />
      );

      await user.click(screen.getByRole("button", { name: "削除する" }));

      expect(mocks.deleteAsync).toHaveBeenCalledWith(news.id);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("キャンセルボタンをクリックするとonOpenChangeが呼ばれる", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <DeleteConfirmDialog
          news={sampleNews()}
          onOpenChange={onOpenChange}
          open={true}
          type="single"
        />
      );

      const cancelButton = screen.getByRole("button", {
        name: "キャンセル",
      });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("bulk delete mode", () => {
    it("選択した件数をタイトルと説明文に表示する", () => {
      const newsIds = [1, 2, 3];
      render(
        <DeleteConfirmDialog
          newsIds={newsIds}
          onOpenChange={vi.fn()}
          open={true}
          type="bulk"
        />
      );

      expect(
        screen.getByText("選択した3件のお知らせを削除しますか？")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/選択した3件のお知らせが完全に削除されます/)
      ).toBeInTheDocument();
    });

    it("確認ボタンでuseBulkDeleteMutationを呼び出す", async () => {
      const user = userEvent.setup();
      mocks.bulkDeleteAsync.mockResolvedValue(undefined);
      const onOpenChange = vi.fn();
      const newsIds = [10, 20, 30];

      render(
        <DeleteConfirmDialog
          newsIds={newsIds}
          onOpenChange={onOpenChange}
          open={true}
          type="bulk"
        />
      );

      await user.click(screen.getByRole("button", { name: "削除する" }));

      expect(mocks.bulkDeleteAsync).toHaveBeenCalledWith({ ids: newsIds });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
