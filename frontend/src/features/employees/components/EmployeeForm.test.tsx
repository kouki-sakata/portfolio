import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EmployeeSummary } from "@/features/auth/types";
import { EmployeeForm } from "./EmployeeForm";

describe("EmployeeForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // レンダリング - 新規作成モード
  // ========================================

  it("新規作成モードで正しくレンダリングする", () => {
    render(<EmployeeForm mode="create" onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText("名")).toBeInTheDocument();
    expect(screen.getByLabelText("姓")).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    expect(screen.getByLabelText("管理者権限")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "登録する" })
    ).toBeInTheDocument();
  });

  // ========================================
  // レンダリング - 更新モード
  // ========================================

  it("デフォルト値を持つ更新モードでレンダリングする", () => {
    const defaultValues: Partial<EmployeeSummary> = {
      firstName: "太郎",
      lastName: "山田",
      email: "yamada@example.com",
      admin: true,
    };

    render(
      <EmployeeForm
        defaultValues={defaultValues}
        mode="update"
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByDisplayValue("太郎")).toBeInTheDocument();
    expect(screen.getByDisplayValue("山田")).toBeInTheDocument();
    expect(screen.getByDisplayValue("yamada@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "更新する" })
    ).toBeInTheDocument();

    // 管理者権限がチェックされている
    const checkbox = screen.getByRole("checkbox", { name: "管理者権限" });
    expect(checkbox).toBeChecked();
  });

  // ========================================
  // バリデーション - 必須フィールド
  // ========================================

  it("必須フィールドのバリデーションエラーを表示する", async () => {
    const user = userEvent.setup();
    render(<EmployeeForm mode="create" onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole("button", { name: "登録する" });
    await user.click(submitButton);

    // 最初のエラーメッセージが表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText("名は必須です")).toBeInTheDocument();
    });

    // 残りのエラーメッセージも表示されていることを確認
    expect(screen.getByText("姓は必須です")).toBeInTheDocument();
    expect(screen.getByText("メールアドレスは必須です")).toBeInTheDocument();
    expect(
      screen.getByText("パスワードは8文字以上で入力してください")
    ).toBeInTheDocument();

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // ========================================
  // バリデーション - メール形式
  // ========================================

  it("メール形式をバリデーションする", async () => {
    const user = userEvent.setup();
    render(<EmployeeForm mode="create" onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText("メールアドレス");
    await user.type(emailInput, "invalid-email");
    await user.tab(); // blur

    await waitFor(() => {
      expect(
        screen.getByText("有効なメールアドレスを入力してください")
      ).toBeInTheDocument();
    });
  });

  // ========================================
  // バリデーション - パスワード長
  // ========================================

  it("新規作成モードでパスワード長をバリデーションする", async () => {
    const user = userEvent.setup();
    render(<EmployeeForm mode="create" onSubmit={mockOnSubmit} />);

    const passwordInput = screen.getByLabelText("パスワード");
    await user.type(passwordInput, "short");
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText("パスワードは8文字以上で入力してください")
      ).toBeInTheDocument();
    });
  });

  it("パスワードが100文字を超える場合バリデーションエラーを表示する", async () => {
    const user = userEvent.setup();
    render(<EmployeeForm mode="create" onSubmit={mockOnSubmit} />);

    const passwordInput = screen.getByLabelText("パスワード");
    const longPassword = "a".repeat(101);
    await user.type(passwordInput, longPassword);
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText("パスワードは100文字以内で入力してください")
      ).toBeInTheDocument();
    });
  });

  // ========================================
  // バリデーション - フィールド長
  // ========================================

  it("名が50文字を超える場合バリデーションエラーを表示する", async () => {
    const user = userEvent.setup();
    render(<EmployeeForm mode="create" onSubmit={mockOnSubmit} />);

    const firstNameInput = screen.getByLabelText("名");
    const longName = "あ".repeat(51);
    await user.type(firstNameInput, longName);
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText("名は50文字以内で入力してください")
      ).toBeInTheDocument();
    });
  });

  it("メールアドレスが255文字を超える場合バリデーションエラーを表示する", async () => {
    const user = userEvent.setup();
    render(<EmployeeForm mode="create" onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText("メールアドレス");
    const longEmail = `${"a".repeat(250)}@example.com`; // 255文字超
    await user.type(emailInput, longEmail);
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText("メールアドレスは255文字以内で入力してください")
      ).toBeInTheDocument();
    });
  });

  // ========================================
  // 新規作成モード - 正常送信
  // ========================================

  it("新規作成モードでフォームを送信する", async () => {
    const user = userEvent.setup();
    render(<EmployeeForm mode="create" onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText("名"), "太郎");
    await user.type(screen.getByLabelText("姓"), "山田");
    await user.type(
      screen.getByLabelText("メールアドレス"),
      "yamada@example.com"
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByLabelText("管理者権限"));

    await user.click(screen.getByRole("button", { name: "登録する" }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        firstName: "太郎",
        lastName: "山田",
        email: "yamada@example.com",
        password: "password123",
        admin: true,
      });
    });
  });

  it("新規作成モードで管理者権限をチェックしない場合falseで送信する", async () => {
    const user = userEvent.setup();
    render(<EmployeeForm mode="create" onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText("名"), "次郎");
    await user.type(screen.getByLabelText("姓"), "田中");
    await user.type(
      screen.getByLabelText("メールアドレス"),
      "tanaka@example.com"
    );
    await user.type(screen.getByLabelText("パスワード"), "password456");

    await user.click(screen.getByRole("button", { name: "登録する" }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          admin: false,
        })
      );
    });
  });

  // ========================================
  // 更新モード - パスワード任意
  // ========================================

  it("更新モードでパスワードを空のまま送信できる", async () => {
    const user = userEvent.setup();
    const defaultValues: Partial<EmployeeSummary> = {
      firstName: "太郎",
      lastName: "山田",
      email: "yamada@example.com",
      admin: false,
    };

    render(
      <EmployeeForm
        defaultValues={defaultValues}
        mode="update"
        onSubmit={mockOnSubmit}
      />
    );

    // パスワードを空のままsubmit
    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          password: "",
        })
      );
    });
  });

  it("更新モードでパスワードを入力した場合は送信される", async () => {
    const user = userEvent.setup();
    const defaultValues: Partial<EmployeeSummary> = {
      firstName: "太郎",
      lastName: "山田",
      email: "yamada@example.com",
      admin: false,
    };

    render(
      <EmployeeForm
        defaultValues={defaultValues}
        mode="update"
        onSubmit={mockOnSubmit}
      />
    );

    await user.type(screen.getByLabelText(/パスワード/), "newpassword123");
    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          password: "newpassword123",
        })
      );
    });
  });

  // ========================================
  // キャンセル機能
  // ========================================

  it("キャンセルボタンがクリックされた場合onCancelを呼ぶ", async () => {
    const user = userEvent.setup();
    render(
      <EmployeeForm
        mode="create"
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
      />
    );

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("onCancelが未指定の場合キャンセルボタンが表示されない", () => {
    render(<EmployeeForm mode="create" onSubmit={mockOnSubmit} />);

    expect(
      screen.queryByRole("button", { name: "キャンセル" })
    ).not.toBeInTheDocument();
  });

  // ========================================
  // 送信中の状態
  // ========================================

  it("送信中はフォームを無効化する", () => {
    render(
      <EmployeeForm isSubmitting={true} mode="create" onSubmit={mockOnSubmit} />
    );

    expect(screen.getByLabelText("名")).toBeDisabled();
    expect(screen.getByLabelText("姓")).toBeDisabled();
    expect(screen.getByLabelText("メールアドレス")).toBeDisabled();
    expect(screen.getByLabelText("パスワード")).toBeDisabled();
    expect(screen.getByLabelText("管理者権限")).toBeDisabled();
    expect(screen.getByRole("button", { name: "処理中..." })).toBeDisabled();
  });

  it("送信中でない場合フォームは有効", () => {
    render(
      <EmployeeForm
        isSubmitting={false}
        mode="create"
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByLabelText("名")).not.toBeDisabled();
    expect(screen.getByLabelText("姓")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "登録する" })).not.toBeDisabled();
  });

  // ========================================
  // リアルタイムバリデーション
  // ========================================

  it("入力変更時にバリデーションが実行される", async () => {
    const user = userEvent.setup();
    render(<EmployeeForm mode="create" onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText("メールアドレス");

    // 不正な入力
    await user.type(emailInput, "invalid");

    await waitFor(() => {
      expect(
        screen.getByText("有効なメールアドレスを入力してください")
      ).toBeInTheDocument();
    });

    // 修正
    await user.clear(emailInput);
    await user.type(emailInput, "valid@example.com");

    await waitFor(() => {
      expect(
        screen.queryByText("有効なメールアドレスを入力してください")
      ).not.toBeInTheDocument();
    });
  });

  // ========================================
  // プレースホルダーとヒント
  // ========================================

  it("更新モードではパスワードフィールドに適切なヒントを表示する", () => {
    render(<EmployeeForm mode="update" onSubmit={mockOnSubmit} />);

    expect(
      screen.getByText("空欄のままにすると、パスワードは変更されません")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("変更する場合のみ入力")
    ).toBeInTheDocument();
  });

  it("新規作成モードではパスワードフィールドに適切なプレースホルダーを表示する", () => {
    render(<EmployeeForm mode="create" onSubmit={mockOnSubmit} />);

    expect(
      screen.getByPlaceholderText("8文字以上で入力してください")
    ).toBeInTheDocument();
  });
});
