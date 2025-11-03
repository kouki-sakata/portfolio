import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BulkMutationResult } from "@/features/news/hooks/useNews";
import {
  type NewsViewModel,
  toNewsViewModel,
} from "@/features/news/lib/newsViewModel";
import { getFirstByRoleOrThrow } from "@/test/dom-assertions";
import type { NewsResponse } from "@/types";
import { NewsManagementPage } from "./NewsManagementPage";

const mocks = vi.hoisted(() => ({
  useNewsQuery: vi.fn(),
  deleteMutate: vi.fn(),
  bulkDeleteMutate: vi.fn(),
  bulkPublishMutate: vi.fn(),
  bulkUnpublishMutate: vi.fn(),
}));

vi.mock("@/features/news/hooks/useNews", () => ({
  useNewsQuery: mocks.useNewsQuery,
  useCreateNewsMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateNewsMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteNewsMutation: () => ({
    mutateAsync: mocks.deleteMutate,
    isPending: false,
  }),
  useTogglePublishMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBulkPublishMutation: () => ({
    mutate: mocks.bulkPublishMutate,
    mutateAsync: vi.fn(),
    isPending: false,
    reset: vi.fn(),
    status: "idle",
  }),
  useBulkUnpublishMutation: () => ({
    mutate: mocks.bulkUnpublishMutate,
    mutateAsync: vi.fn(),
    isPending: false,
    reset: vi.fn(),
    status: "idle",
  }),
  useBulkDeleteMutation: () => ({
    mutateAsync: mocks.bulkDeleteMutate,
    isPending: false,
  }),
}));

vi.mock("./NewsFormModal", () => ({
  NewsFormModal: ({
    mode,
    open,
    news,
    onClose,
  }: {
    mode: "create" | "edit";
    open: boolean;
    news?: NewsViewModel;
    onClose: () => void;
  }) => (
    <div data-testid="news-form-modal">
      <span>mode:{mode}</span>
      <span>open:{open ? "true" : "false"}</span>
      <span>selected:{news?.id ?? "none"}</span>
      <button onClick={onClose} type="button">
        閉じる
      </button>
    </div>
  ),
}));

vi.mock("./DeleteConfirmDialog", () => ({
  DeleteConfirmDialog: ({
    type,
    news,
    newsIds = [],
    open,
    onConfirm,
    onOpenChange,
  }: {
    type: "single" | "bulk";
    news?: NewsViewModel;
    newsIds?: number[];
    open: boolean;
    onConfirm?: () => void;
    onOpenChange: (open: boolean) => void;
  }) => {
    if (!open) {
      return null;
    }

    const count = type === "single" ? 1 : newsIds.length;
    const message =
      type === "single"
        ? "このお知らせを削除しますか？"
        : `選択した${count}件のお知らせを削除しますか？`;

    const handleConfirm = () => {
      if (type === "bulk") {
        void mocks.bulkDeleteMutate({ ids: newsIds });
      } else if (type === "single" && news) {
        void mocks.deleteMutate(news.id);
      }
      onConfirm?.();
      onOpenChange(false);
    };

    return (
      <div role="dialog">
        <p>{message}</p>
        <button onClick={handleConfirm} type="button">
          削除する
        </button>
      </div>
    );
  },
}));

const sampleNews = (overrides?: Partial<NewsResponse>): NewsViewModel => {
  const base: NewsResponse = {
    id: overrides?.id ?? 1,
    newsDate: overrides?.newsDate ?? "2025-10-10",
    title: overrides?.title ?? "リリースノート",
    content: overrides?.content ?? "本日のリリース内容をご確認ください。",
    label: overrides?.label ?? "GENERAL",
    releaseFlag: overrides?.releaseFlag ?? true,
    updateDate: overrides?.updateDate ?? "2025-10-10T12:00:00Z",
  };

  return toNewsViewModel(base);
};

describe("NewsManagementPage", () => {
  beforeEach(() => {
    mocks.useNewsQuery.mockReset();
    mocks.deleteMutate.mockReset();
    mocks.bulkDeleteMutate.mockReset();
    mocks.bulkPublishMutate.mockReset();
    mocks.bulkUnpublishMutate.mockReset();
    mocks.deleteMutate.mockResolvedValue(undefined);
    mocks.bulkDeleteMutate.mockResolvedValue({ successIds: [], failedIds: [] });
    mocks.bulkPublishMutate.mockImplementation(() => {
      // noop: default mutation handler for tests without assertions
    });
    mocks.bulkUnpublishMutate.mockImplementation(() => {
      // noop: default mutation handler for tests without assertions
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("ローディング時にスケルトンを表示する", () => {
    mocks.useNewsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NewsManagementPage />);

    expect(screen.getAllByTestId("news-card-skeleton")).toHaveLength(4);
  });

  it("エラー時にエラーメッセージを表示する", () => {
    mocks.useNewsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    render(<NewsManagementPage />);

    expect(
      screen.getByText("お知らせを取得できませんでした")
    ).toBeInTheDocument();
  });

  it("データ取得後にヘッダーと公開中カードを表示する", () => {
    mocks.useNewsQuery.mockReturnValue({
      data: { news: [sampleNews()] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NewsManagementPage />);

    expect(screen.getByText("お知らせ管理")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新規作成" })).toBeEnabled();

    const releaseNotes = screen.getAllByText("リリースノート");
    expect(releaseNotes.length).toBeGreaterThan(0);
  });

  it("公開中カードクリックで詳細モーダルを表示する", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const news = sampleNews({
      id: 99,
      title: "カード詳細",
      content: "詳細本文\n追加情報を確認してください。",
      label: "GENERAL",
    });

    mocks.useNewsQuery.mockReturnValue({
      data: { news: [news] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NewsManagementPage />);

    const cardButton = screen.getByRole("button", {
      name: `${news.title}の詳細モーダルを開く`,
    });

    await user.click(cardButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const detailDialog = screen.getByRole("dialog");

    expect(within(detailDialog).getByText("カード詳細")).toBeInTheDocument();
    expect(
      within(detailDialog).getByText(/詳細本文/, {
        selector: "p:not(.sr-only)",
      })
    ).toBeInTheDocument();
  });

  it("新規作成ボタンクリックで作成モーダルが開く", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    mocks.useNewsQuery.mockReturnValue({
      data: { news: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NewsManagementPage />);

    const firstCreateButton = getFirstByRoleOrThrow(
      screen.getAllByRole("button", { name: "新規作成" }),
      "新規作成ボタン"
    );

    await user.click(firstCreateButton);

    expect(screen.getByText("mode:create")).toBeInTheDocument();
    expect(screen.getByText("open:true")).toBeInTheDocument();
  });

  it("編集ボタンで編集モードのモーダルが開く", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const news = sampleNews({
      id: 55,
      title: "編集対象",
      content: "編集対象本文",
    });
    mocks.useNewsQuery.mockReturnValue({
      data: { news: [news] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NewsManagementPage />);

    const editButton = getFirstByRoleOrThrow(
      screen.getAllByLabelText("編集"),
      "編集ボタン"
    );

    await user.click(editButton);

    expect(await screen.findByText("mode:edit")).toBeInTheDocument();
    expect(await screen.findByText("selected:55")).toBeInTheDocument();
  });

  it("テーブルのアクションボタンに aria-label が付与される", () => {
    const news = sampleNews({
      id: 101,
      title: "アクセシビリティ検証",
      content: "アクセシビリティ検証本文",
    });
    mocks.useNewsQuery.mockReturnValue({
      data: { news: [news] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NewsManagementPage />);

    const editButton = screen.getAllByRole("button", { name: "編集" })[0];
    const deleteButton = screen.getAllByRole("button", { name: "削除" })[0];

    expect(editButton).toHaveAttribute("aria-label", "編集");
    expect(deleteButton).toHaveAttribute("aria-label", "削除");
  });

  it("全選択後に一括削除ボタンを表示し、確定で選択状態をリセットする", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const items = [
      sampleNews({ id: 301, title: "削除対象", content: "削除対象本文" }),
      sampleNews({ id: 302, title: "残し", content: "残し本文" }),
    ];

    mocks.useNewsQuery.mockReturnValue({
      data: { news: items },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mocks.bulkDeleteMutate.mockResolvedValue({
      successIds: [301, 302],
      failedIds: [],
    });

    render(<NewsManagementPage />);

    await user.click(screen.getByLabelText("全て選択"));

    const table = screen.getByLabelText("データテーブル");
    const itemCheckboxes = within(table).getAllByRole("checkbox", {
      name: /のお知らせを選択$/,
    });

    expect(itemCheckboxes).toHaveLength(2);
    for (const checkbox of itemCheckboxes) {
      expect(checkbox).toHaveAttribute("data-state", "checked");
    }

    const bulkDeleteButton = screen.getByRole("button", {
      name: "選択した2件を削除",
    });
    expect(bulkDeleteButton).toBeEnabled();

    await user.click(bulkDeleteButton);

    expect(
      await screen.findByText("選択した2件のお知らせを削除しますか？")
    ).toBeInTheDocument();

    const confirmButton = await screen.findByRole("button", {
      name: "削除する",
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mocks.bulkDeleteMutate).toHaveBeenCalledWith({
        ids: [301, 302],
      });
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "選択した2件を削除" })
      ).not.toBeInTheDocument();
    });
  });

  it("選択状態で一括公開と一括非公開ボタンを表示しミューテーションを呼び出す", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const items = [
      sampleNews({ id: 201, content: "成功", releaseFlag: false }),
      sampleNews({ id: 202, content: "失敗", releaseFlag: true }),
    ];

    mocks.useNewsQuery.mockReturnValue({
      data: { news: items },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const publishResult: BulkMutationResult = {
      successIds: [201],
      failedIds: [],
    };
    const unpublishResult: BulkMutationResult = {
      successIds: [202],
      failedIds: [],
    };

    mocks.bulkPublishMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.(publishResult);
    });
    mocks.bulkUnpublishMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.(unpublishResult);
    });

    render(<NewsManagementPage />);

    await user.click(screen.getByLabelText("全て選択"));

    const bulkPublishButton = screen.getByRole("button", { name: "一括公開" });
    let bulkUnpublishButton = screen.getByRole("button", {
      name: "一括非公開",
    });

    expect(bulkPublishButton).toBeEnabled();
    expect(bulkUnpublishButton).toBeEnabled();

    await user.click(bulkPublishButton);

    expect(mocks.bulkPublishMutate).toHaveBeenCalledWith(
      { ids: [201, 202] },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );

    // 全成功の場合は選択状態を保持（連続操作のため）
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "一括公開" })
      ).toBeInTheDocument();
    });

    // 選択状態が保持されているため、一括非公開ボタンもそのまま表示されている
    bulkUnpublishButton = screen.getByRole("button", {
      name: "一括非公開",
    });

    await user.click(bulkUnpublishButton);

    expect(mocks.bulkUnpublishMutate).toHaveBeenCalledWith(
      { ids: [201, 202] },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});
