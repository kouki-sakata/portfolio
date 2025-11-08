import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignInPage } from "@/features/auth/components/SignInPage";
import * as useAuthModule from "@/features/auth/hooks/useAuth";

// Mock useAuth hook
const mockLogin = vi.fn();
const mockUseAuth = vi.spyOn(useAuthModule, "useAuth");

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderSignInPage = () =>
  render(
    <BrowserRouter>
      <SignInPage />
    </BrowserRouter>
  );

const createUser = () => userEvent.setup({ delay: null });

describe("SignInPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      // 基本認証状態
      user: null,
      authenticated: false,
      loading: false,

      // 認証アクション
      login: mockLogin,
      logout: vi.fn(),

      // セッション管理
      sessionInfo: null,
      refreshSession: vi.fn(),
      isSessionExpiring: false,
      timeUntilExpiry: null,
      sessionTimeoutWarning: false,

      // CSRF保護
      csrfToken: null,
      refreshCsrfToken: vi.fn(),
    });
  });

  describe("フォームレンダリング", () => {
    it("メールアドレス入力フィールドを表示する", () => {
      renderSignInPage();

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("name", "email");
    });

    it("パスワード入力フィールドを表示する", () => {
      renderSignInPage();

      const passwordInput = screen.getByLabelText(/パスワード/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("name", "password");
    });

    it("サインインボタンを表示する", () => {
      renderSignInPage();

      const submitButton = screen.getByRole("button", { name: /サインイン/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute("type", "submit");
    });

    it("タイトルを表示する", () => {
      renderSignInPage();

      expect(
        screen.getByRole("heading", { name: /TeamDevelop Bravo にサインイン/i })
      ).toBeInTheDocument();
    });
  });

  describe("バリデーションエラー", () => {
    it("無効なメールアドレス形式でエラーを表示する", async () => {
      const user = createUser();
      renderSignInPage();

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const submitButton = screen.getByRole("button", { name: /サインイン/i });

      // 無効なメールアドレスを入力
      await user.type(emailInput, "invalid-email");
      await user.click(submitButton);

      expect(
        await screen.findByText(/有効なメールアドレスを入力してください/i)
      ).toBeInTheDocument();
    });

    it("空のメールアドレスでエラーを表示する", async () => {
      const user = createUser();
      renderSignInPage();

      const passwordInput = screen.getByLabelText(/パスワード/i);
      const submitButton = screen.getByRole("button", { name: /サインイン/i });

      // パスワードのみ入力してsubmit
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      expect(
        await screen.findByText(/メールアドレスを入力してください/i)
      ).toBeInTheDocument();
    });

    it("8文字未満のパスワードでエラーを表示する", async () => {
      const user = createUser();
      renderSignInPage();

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const submitButton = screen.getByRole("button", { name: /サインイン/i });

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "short");
      await user.click(submitButton);

      expect(
        await screen.findByText(/パスワードは8文字以上で入力してください/i)
      ).toBeInTheDocument();
    });

    it("空のパスワードでエラーを表示する", async () => {
      const user = createUser();
      renderSignInPage();

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const submitButton = screen.getByRole("button", { name: /サインイン/i });

      // メールアドレスのみ入力してsubmit
      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      expect(
        await screen.findByText(/パスワードは8文字以上で入力してください/i)
      ).toBeInTheDocument();
    });

    it("フォーカスアウト時にバリデーションエラーを表示する", async () => {
      const user = createUser();
      renderSignInPage();

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);

      // 無効なメールアドレスを入力してフォーカスアウト
      await user.type(emailInput, "invalid");
      await user.click(passwordInput); // 別のフィールドにフォーカス

      expect(
        await screen.findByText(/有効なメールアドレスを入力してください/i)
      ).toBeInTheDocument();
    });
  });

  describe("フォーム送信", () => {
    it("有効な入力でログイン関数を呼び出す", async () => {
      const user = createUser();
      mockLogin.mockResolvedValue(undefined);

      renderSignInPage();

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const submitButton = screen.getByRole("button", { name: /サインイン/i });

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: "user@example.com",
          password: "password123",
        });
      });
    });

    it("ログイン成功時にホームページへリダイレクトする", async () => {
      const user = createUser();
      mockLogin.mockResolvedValue(undefined);

      renderSignInPage();

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const submitButton = screen.getByRole("button", { name: /サインイン/i });

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("ローディング中は「サインイン中...」を表示する", () => {
      mockUseAuth.mockReturnValue({
        // 基本認証状態
        user: null,
        authenticated: false,
        loading: true,

        // 認証アクション
        login: mockLogin,
        logout: vi.fn(),

        // セッション管理
        sessionInfo: null,
        refreshSession: vi.fn(),
        isSessionExpiring: false,
        timeUntilExpiry: null,
        sessionTimeoutWarning: false,

        // CSRF保護
        csrfToken: null,
        refreshCsrfToken: vi.fn(),
      });

      renderSignInPage();

      const submitButton = screen.getByRole("button", {
        name: /サインイン中/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("ログイン失敗時にエラーメッセージを表示する", async () => {
      const user = createUser();
      mockLogin.mockRejectedValue(new Error("Login failed"));

      renderSignInPage();

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const submitButton = screen.getByRole("button", { name: /サインイン/i });

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      expect(
        await screen.findByText(
          /メールアドレスまたはパスワードが正しくありません/i
        )
      ).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("フィールドが適切なaria属性を持つ", async () => {
      const user = createUser();
      renderSignInPage();

      const emailInput = screen.getByLabelText(/メールアドレス/i);

      // 無効な入力でaria-invalid属性を確認
      await user.type(emailInput, "invalid");
      await user.tab(); // フォーカスアウト

      await screen.findByText(/有効なメールアドレスを入力してください/i);
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });

    it("エラーメッセージがフィールドと関連付けられている", async () => {
      const user = createUser();
      renderSignInPage();

      const emailInput = screen.getByLabelText(/メールアドレス/i);
      await user.type(emailInput, "invalid");
      await user.tab();

      const errorMessage =
        await screen.findByText(/有効なメールアドレスを入力してください/i);
      const errorId = errorMessage.getAttribute("id");
      expect(emailInput).toHaveAttribute(
        "aria-describedby",
        expect.stringContaining(errorId || "")
      );
    });
  });
});
