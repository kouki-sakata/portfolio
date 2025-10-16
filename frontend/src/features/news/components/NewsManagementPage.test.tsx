import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NewsResponse } from "@/types/types.gen";
import { NewsManagementPage } from "./NewsManagementPage";

const mocks = vi.hoisted(() => ({
  useNewsQuery: vi.fn(),
}));

vi.mock("@/features/news/hooks/useNews", () => ({
  useNewsQuery: mocks.useNewsQuery,
  useCreateNewsMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateNewsMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteNewsMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTogglePublishMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("./NewsCard", () => ({
  // biome-ignore lint/style/useNamingConvention: vi.mockでは元のコンポーネント名を使用する必要がある
  NewsCard: ({
    news,
    onEdit,
  }: {
    news: NewsResponse;
    onEdit?: (item: NewsResponse) => void;
  }) => (
    <div>
      <span>{news.content}</span>
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
  id: 1,
  newsDate: "2025-10-10",
  content: "リリースノート",
  releaseFlag: true,
  updateDate: "2025-10-10T12:00:00Z",
  ...overrides,
});

describe("NewsManagementPage", () => {
  beforeEach(() => {
    mocks.useNewsQuery.mockReset();
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
      data: [sampleNews()],
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
      data: [],
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
      data: [news],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NewsManagementPage />);

    await user.click(screen.getByRole("button", { name: "編集" }));

    expect(screen.getByText("mode:edit")).toBeInTheDocument();
    expect(screen.getByText("selected:55")).toBeInTheDocument();
  });
});
