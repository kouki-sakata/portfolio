import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NewsResponse } from "@/types/types.gen";
import { NewsFormModal } from "./NewsFormModal";

const mocks = vi.hoisted(() => ({
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/features/news/hooks/useNews", () => ({
  useCreateNewsMutation: () => ({
    mutateAsync: mocks.createMutate,
    isPending: false,
  }),
  useUpdateNewsMutation: () => ({
    mutateAsync: mocks.updateMutate,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

const sampleNews: NewsResponse = {
  id: 10,
  newsDate: "2025-10-12",
  content: "秋の社内イベントのお知らせ",
  releaseFlag: false,
  updateDate: "2025-10-12T08:30:00Z",
};

describe("NewsFormModal", () => {
  beforeEach(() => {
    mocks.createMutate.mockReset();
    mocks.updateMutate.mockReset();
    mocks.createMutate.mockResolvedValue(undefined);
    mocks.updateMutate.mockResolvedValue(undefined);
    mocks.toast.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("新規作成モードでフォーム送信時に作成ミューテーションを呼び出す", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    renderWithClient(
      <NewsFormModal mode="create" onClose={handleClose} open={true} />
    );

    const dateInput = screen.getByLabelText("お知らせ日付");
    const contentInput = screen.getByLabelText("内容");

    await user.type(dateInput, "2025-10-20");
    await user.type(contentInput, "新しい機能をリリースしました。");

    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(mocks.createMutate).toHaveBeenCalledWith({
        newsDate: "2025-10-20",
        content: "新しい機能をリリースしました。",
      });
    });

    expect(handleClose).toHaveBeenCalled();
  });

  it("未入力で送信するとバリデーションエラーを表示する", async () => {
    const user = userEvent.setup();

    renderWithClient(
      <NewsFormModal mode="create" onClose={vi.fn()} open={true} />
    );

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByText("内容は必須です")).toBeInTheDocument();
    expect(mocks.createMutate).not.toHaveBeenCalled();
  });

  it("編集モードで初期値を表示し、更新ミューテーションを呼び出す", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    renderWithClient(
      <NewsFormModal
        mode="edit"
        news={sampleNews}
        onClose={handleClose}
        open={true}
      />
    );

    expect(screen.getByDisplayValue("2025-10-12")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("秋の社内イベントのお知らせ")
    ).toBeInTheDocument();

    const contentInput = screen.getByLabelText("内容");
    await user.clear(contentInput);
    await user.type(contentInput, "内容を更新しました。");

    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(mocks.updateMutate).toHaveBeenCalledWith({
        id: sampleNews.id,
        newsDate: "2025-10-12",
        content: "内容を更新しました。",
      });
    });

    expect(handleClose).toHaveBeenCalled();
  });
});
