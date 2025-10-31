import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NewsResponse } from "@/types";
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
  title: "秋の社内イベント",
  content: "秋の社内イベントのお知らせ",
  label: "GENERAL",
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
    const titleInput = screen.getByLabelText("タイトル");
    const contentInput = screen.getByLabelText("内容");
    const importantRadio = screen.getByLabelText("重要");
    const publishSwitch = screen.getByRole("switch", { name: "公開設定" });

    await user.type(dateInput, "2025-10-20");
    await user.type(titleInput, "新規公開案内");
    await user.type(contentInput, "新しい機能をリリースしました。");
    await user.click(importantRadio);
    await user.click(publishSwitch);

    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(mocks.createMutate).toHaveBeenCalledWith({
        newsDate: "2025-10-20",
        title: "新規公開案内",
        content: "新しい機能をリリースしました。",
        label: "IMPORTANT",
        releaseFlag: true,
      });
    });

    expect(handleClose).toHaveBeenCalled();
  });

  it("ラベルを選択しなくても既定GENERALで送信する", async () => {
    const user = userEvent.setup();

    renderWithClient(
      <NewsFormModal mode="create" onClose={vi.fn()} open={true} />
    );

    await user.type(screen.getByLabelText("お知らせ日付"), "2025-10-21");
    await user.type(screen.getByLabelText("タイトル"), "既定値テスト");
    await user.type(screen.getByLabelText("内容"), "既定ラベル処理の確認です。");

    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(mocks.createMutate).toHaveBeenCalledWith({
        newsDate: "2025-10-21",
        title: "既定値テスト",
        content: "既定ラベル処理の確認です。",
        label: "GENERAL",
        releaseFlag: false,
      });
    });
  });

  it("未入力で送信するとバリデーションエラーを表示する", async () => {
    const user = userEvent.setup();

    renderWithClient(
      <NewsFormModal mode="create" onClose={vi.fn()} open={true} />
    );

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByText("内容は必須です")).toBeInTheDocument();
    expect(await screen.findByText("タイトルは必須です")).toBeInTheDocument();
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
    expect(screen.getByDisplayValue("秋の社内イベント")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("秋の社内イベントのお知らせ")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("一般")).toBeChecked();
    expect(
      screen.getByRole("switch", { name: "公開設定" })
    ).not.toBeChecked();

    const contentInput = screen.getByLabelText("内容");
    await user.clear(contentInput);
    await user.type(contentInput, "内容を更新しました。");
    await user.clear(screen.getByLabelText("タイトル"));
    await user.type(screen.getByLabelText("タイトル"), "更新後タイトル");
    await user.click(screen.getByLabelText("システム"));
    await user.click(screen.getByRole("switch", { name: "公開設定" }));

    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(mocks.updateMutate).toHaveBeenCalledWith({
        id: sampleNews.id,
        data: {
          newsDate: "2025-10-12",
          title: "更新後タイトル",
          content: "内容を更新しました。",
          label: "SYSTEM",
          releaseFlag: true,
        },
      });
    });

    expect(handleClose).toHaveBeenCalled();
  });

  it("バリデーションエラー時に入力がエラー要素を aria-describedby で参照する", async () => {
    const user = userEvent.setup();

    renderWithClient(
      <NewsFormModal mode="create" onClose={vi.fn()} open={true} />
    );

    await user.click(screen.getByRole("button", { name: "保存" }));

    const dateInput = screen.getByLabelText("お知らせ日付");
    const titleInput = screen.getByLabelText("タイトル");
    const contentInput = screen.getByLabelText("内容");

    const dateDescribedBy = dateInput.getAttribute("aria-describedby");
    const titleDescribedBy = titleInput.getAttribute("aria-describedby");
    const contentDescribedBy = contentInput.getAttribute("aria-describedby");

    expect(dateInput).toHaveAttribute("aria-invalid", "true");
    expect(titleInput).toHaveAttribute("aria-invalid", "true");
    expect(contentInput).toHaveAttribute("aria-invalid", "true");
    expect(dateDescribedBy ?? "").toMatch(/newsDate-error/);
    expect(titleDescribedBy ?? "").toMatch(/title-error/);
    expect(contentDescribedBy ?? "").toMatch(/content-error/);

    if (dateDescribedBy) {
      const dateError = document.getElementById(dateDescribedBy);
      expect(dateError).not.toBeNull();
      expect(dateError?.textContent).toContain("お知らせ日付は必須です");
    }
    if (titleDescribedBy) {
      const titleError = document.getElementById(titleDescribedBy);
      expect(titleError).not.toBeNull();
      expect(titleError?.textContent).toContain("タイトルは必須です");
    }
    if (contentDescribedBy) {
      const contentError = document.getElementById(contentDescribedBy);
      expect(contentError).not.toBeNull();
      expect(contentError?.textContent).toContain("内容は必須です");
    }
  });

  it("モーダル表示時に最初の入力へフォーカスする", async () => {
    renderWithClient(
      <NewsFormModal mode="create" onClose={vi.fn()} open={true} />
    );

    const dateInput = await screen.findByLabelText("お知らせ日付");

    await waitFor(() => {
      expect(dateInput).toHaveFocus();
    });
  });

  it("ダイアログに aria-modal=true が設定される", () => {
    renderWithClient(
      <NewsFormModal mode="create" onClose={vi.fn()} open={true} />
    );

    const dialog = screen.getByRole("dialog", { name: "お知らせを作成" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});
