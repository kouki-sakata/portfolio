import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NewsResponse } from "@/types";
import { NewsManagementPage } from "./NewsManagementPage";

const mocks = vi.hoisted(() => ({
  useNewsQuery: vi.fn(),
  bulkPublishMutate: vi.fn(),
  bulkUnpublishMutate: vi.fn(),
  bulkDeleteMutate: vi.fn(),
}));

vi.mock("@/features/news/hooks/useNews", () => ({
  useNewsQuery: mocks.useNewsQuery,
  useCreateNewsMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateNewsMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteNewsMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTogglePublishMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBulkPublishMutation: () => ({
    mutateAsync: mocks.bulkPublishMutate,
    isPending: false,
  }),
  useBulkUnpublishMutation: () => ({
    mutateAsync: mocks.bulkUnpublishMutate,
    isPending: false,
  }),
  useBulkDeleteMutation: () => ({
    mutateAsync: mocks.bulkDeleteMutate,
    isPending: false,
  }),
}));

vi.mock("./NewsCard", () => ({
  // biome-ignore lint/style/useNamingConvention: vi.mockでは元のコンポーネント名を使用する必要がある
  NewsCard: ({
    news,
    onEdit,
    selectable,
    selected,
    onSelectionChange,
  }: {
    news: NewsResponse;
    onEdit?: (item: NewsResponse) => void;
    selectable?: boolean;
    selected?: boolean;
    onSelectionChange?: (item: NewsResponse, next: boolean) => void;
  }) => (
    <div>
      <span>{news.content}</span>
      {selectable ? (
        <input
          aria-label={`${news.content}を選択`}
          checked={selected}
          onChange={(event) =>
            onSelectionChange?.(news, event.currentTarget.checked)
          }
          type="checkbox"
        />
      ) : null}
      <button onClick={() => onEdit?.(news)} type="button">
        編集
      </button>
    </div>
  ),
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
    mocks.bulkPublishMutate.mockReset();
    mocks.bulkUnpublishMutate.mockReset();
    mocks.bulkDeleteMutate.mockReset();
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

    expect(screen.getAllByTestId("news-card-skeleton")).toHaveLength(3);
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

  it("データ取得後にカード一覧と新規作成ボタンを表示する", () => {
    mocks.useNewsQuery.mockReturnValue({
      data: { news: [sampleNews()] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NewsManagementPage />);

    expect(screen.getByText("お知らせ管理")).toBeInTheDocument();
    expect(screen.getByText("リリースノート")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新規作成" })).toBeEnabled();
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

    // 空状態では2つの「新規作成」ボタンが存在するため、最初のもの（ヘッダーのボタン）を選択
    const createButtons = screen.getAllByRole("button", { name: "新規作成" });
    // getAllByRole()が成功した時点で配列には必ず要素が存在する
    expect(createButtons.length).toBeGreaterThan(0);
    const firstButton = createButtons[0];
    if (!firstButton) {
      throw new Error("First button not found");
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

    await user.click(screen.getByRole("button", { name: "編集" }));

    expect(screen.getByText("mode:edit")).toBeInTheDocument();
    expect(screen.getByText("selected:55")).toBeInTheDocument();
  });

  it("全選択チェックボックスでカードが選択され一括操作バーが表示される", async () => {
    const user = userEvent.setup();
    const items = [
      sampleNews({ id: 101, content: "A" }),
      sampleNews({ id: 102, content: "B" }),
    ];

    mocks.useNewsQuery.mockReturnValue({
      data: { news: items },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NewsManagementPage />);

    const selectAll = screen.getByLabelText("全て選択");
    await user.click(selectAll);

    const itemCheckboxes = screen.getAllByRole("checkbox", {
      name: /を選択$/,
    });

    expect(itemCheckboxes).toHaveLength(2);
    expect(
      itemCheckboxes.every(
        (checkbox) => checkbox instanceof HTMLInputElement && checkbox.checked
      )
    ).toBe(true);

    expect(screen.getByText("選択中: 2件")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "一括公開" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "一括削除" })).toBeEnabled();
  });

  it("一括公開実行後に失敗したIDのみ選択状態を維持する", async () => {
    const user = userEvent.setup();
    const items = [
      sampleNews({ id: 201, content: "成功" }),
      sampleNews({ id: 202, content: "失敗" }),
    ];

    mocks.useNewsQuery.mockReturnValue({
      data: { news: items },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mocks.bulkPublishMutate.mockResolvedValue({
      successIds: [201],
      failedIds: [202],
    });

    render(<NewsManagementPage />);

    await user.click(screen.getByLabelText("全て選択"));

    await user.click(screen.getByRole("button", { name: "一括公開" }));

    expect(mocks.bulkPublishMutate).toHaveBeenCalledWith({ ids: [201, 202] });

    expect(await screen.findByText("選択中: 1件")).toBeInTheDocument();

    const remaining = screen
      .getAllByRole("checkbox", {
        name: /を選択$/,
      })
      .filter((checkbox) => (checkbox as HTMLInputElement).checked);

    expect(remaining).toHaveLength(1);
  });

  it("一括削除ボタンで削除ミューテーションが呼び出される", async () => {
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
      successIds: [301],
      failedIds: [],
    });

    render(<NewsManagementPage />);

    await user.click(screen.getByLabelText("全て選択"));

    await user.click(screen.getByRole("button", { name: "一括削除" }));

    expect(mocks.bulkDeleteMutate).toHaveBeenCalledWith({ ids: [301, 302] });
  });
});
