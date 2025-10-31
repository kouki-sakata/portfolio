import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NewsResponse } from "@/types";
import { NewsCard } from "./NewsCard";

const mocks = vi.hoisted(() => ({
  toggleMutate: vi.fn(),
  deleteMutate: vi.fn(),
  bulkDeleteMutate: vi.fn(),
}));

vi.mock("@/features/news/hooks/useNews", () => ({
  useTogglePublishMutation: () => ({
    mutateAsync: mocks.toggleMutate,
    isPending: false,
  }),
  useDeleteNewsMutation: () => ({
    mutateAsync: mocks.deleteMutate,
    isPending: false,
  }),
  useBulkDeleteMutation: () => ({
    mutateAsync: mocks.bulkDeleteMutate,
    isPending: false,
  }),
}));

const newsSample = (): NewsResponse => ({
  id: 42,
  newsDate: "2025-10-10",
  title: "重要メンテナンスのお知らせ",
  content: "重要メンテナンスのお知らせ",
  label: "SYSTEM",
  releaseFlag: true,
  updateDate: "2025-10-10T12:00:00Z",
});

describe("NewsCard", () => {
  beforeEach(() => {
    mocks.toggleMutate.mockResolvedValue(undefined);
    mocks.deleteMutate.mockResolvedValue(undefined);
    mocks.bulkDeleteMutate.mockResolvedValue({
      successIds: [],
      failedIds: [],
    });
  });

  afterEach(() => {
    mocks.toggleMutate.mockReset();
    mocks.deleteMutate.mockReset();
    mocks.bulkDeleteMutate.mockReset();
    vi.clearAllMocks();
  });

  it("公開中バッジと内容を表示する", () => {
    render(<NewsCard news={newsSample()} onEdit={vi.fn()} />);

    expect(screen.getByText("重要メンテナンスのお知らせ")).toBeInTheDocument();
    expect(screen.getByText("2025-10-10")).toBeInTheDocument();
    expect(screen.getByText("公開中")).toBeInTheDocument();
  });

  it("下書きの場合は下書きバッジを表示する", () => {
    const draft = {
      ...newsSample(),
      releaseFlag: false,
    } satisfies NewsResponse;
    render(<NewsCard news={draft} onEdit={vi.fn()} />);

    expect(screen.getByText("下書き")).toBeInTheDocument();
  });

  it("編集ボタンでonEditが呼び出される", async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();

    const news = newsSample();
    render(<NewsCard news={news} onEdit={handleEdit} />);

    await user.click(screen.getByRole("button", { name: "編集" }));

    expect(handleEdit).toHaveBeenCalledWith(news);
  });

  it("公開切り替えボタンでmutateAsyncが呼び出される", async () => {
    const user = userEvent.setup();
    const news = newsSample();

    render(<NewsCard news={news} onEdit={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "公開状態を切り替え" })
    );

    expect(mocks.toggleMutate).toHaveBeenCalledWith({
      id: news.id,
      releaseFlag: false,
    });
  });

  it("削除確認後に削除ミューテーションを実行する", async () => {
    const user = userEvent.setup();
    const news = newsSample();

    render(<NewsCard news={news} onEdit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "削除" }));

    const confirmButton = await screen.findByRole("button", {
      name: "削除する",
    });

    await user.click(confirmButton);

    expect(mocks.deleteMutate).toHaveBeenCalledWith(news.id);
  });

  it("選択可能時にチェックボックス経由で選択状態を通知する", async () => {
    const user = userEvent.setup();
    const news = newsSample();
    const handleSelection = vi.fn();

    render(
      <NewsCard
        news={news}
        onEdit={vi.fn()}
        onSelectionChange={handleSelection}
        selectable
        selected={false}
      />
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "重要メンテナンスのお知らせを選択",
    });

    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(handleSelection).toHaveBeenCalledWith(news, true);
  });

  it("ステータスバッジが高コントラスト表示のメタデータを持つ", () => {
    render(<NewsCard news={newsSample()} onEdit={vi.fn()} />);

    const badge = screen.getByText("公開中");

    expect(badge).toHaveAttribute("data-contrast-level", "aa");
  });
});
