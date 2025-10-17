import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NewsResponse } from "@/types";
import { NewsManagementPage } from "./NewsManagementPage";

const mocks = vi.hoisted(() => ({
  useNewsQuery: vi.fn(),
  deleteMutate: vi.fn(),
  bulkDeleteMutate: vi.fn(),
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
  useBulkDeleteMutation: () => ({
    mutateAsync: mocks.bulkDeleteMutate,
    isPending: false,
  }),
}));

vi.mock("./NewsFormModal", () => ({
  // biome-ignore lint/style/useNamingConvention: vi.mockでは元のコンポーネント名を使用する必要がある
  NewsFormModal: ({
    mode,
    open,
    news,
    onClose,
  }: {
    mode: "create" | "edit";
    open: boolean;
    news?: NewsResponse;
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

const sampleNews = (overrides?: Partial<NewsResponse>): NewsResponse => ({
  id: overrides?.id ?? 1,
  newsDate: overrides?.newsDate ?? "2025-10-10",
  title: overrides?.title ?? "リリースノート",
  content: overrides?.content ?? "新機能のリリース情報",
  category: overrides?.category ?? "一般",
  releaseFlag: overrides?.releaseFlag ?? true,
  updateDate: overrides?.updateDate ?? "2025-10-10T12:00:00Z",
});

describe("NewsManagementPage", () => {
  beforeEach(() => {
    mocks.useNewsQuery.mockReset();
    mocks.deleteMutate.mockReset();
    mocks.bulkDeleteMutate.mockReset();
    mocks.deleteMutate.mockResolvedValue(undefined);
    mocks.bulkDeleteMutate.mockResolvedValue({ successIds: [], failedIds: [] });
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

  it("新規作成ボタンクリックで作成モーダルが開く", async () => {
    const user = userEvent.setup();
    mocks.useNewsQuery.mockReturnValue({
      data: { news: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NewsManagementPage />);

    const createButtons = screen.getAllByRole("button", { name: "新規作成" });
    expect(createButtons.length).toBeGreaterThan(0);

    const [firstButton] = createButtons;
    if (!firstButton) {
      throw new Error("First create button not found");
    }

    await user.click(firstButton);

    expect(screen.getByText("mode:create")).toBeInTheDocument();
    expect(screen.getByText("open:true")).toBeInTheDocument();
  });

  it("編集ボタンで編集モードのモーダルが開く", async () => {
    const user = userEvent.setup();
    const news = sampleNews({ id: 55, content: "編集対象" });
    mocks.useNewsQuery.mockReturnValue({
      data: { news: [news] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NewsManagementPage />);

    const editButtons = screen.getAllByRole("button", { name: /編集/ });
    const [editButton] = editButtons;
    if (!editButton) {
      throw new Error("Edit button not found");
    }

    await user.click(editButton);

    expect(screen.getByText("mode:edit")).toBeInTheDocument();
    expect(screen.getByText("selected:55")).toBeInTheDocument();
  });

  it("全選択後に一括削除ボタンを表示し、確定で選択状態をリセットする", async () => {
    const user = userEvent.setup();
    const items = [
      sampleNews({ id: 301, content: "削除対象" }),
      sampleNews({ id: 302, content: "残し" }),
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
});
