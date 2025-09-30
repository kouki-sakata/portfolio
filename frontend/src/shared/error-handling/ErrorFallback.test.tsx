import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NetworkError, UnexpectedError, ValidationError } from "../api/errors";
import { ErrorFallback } from "./ErrorFallback";

describe("ErrorFallback", () => {
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Error Display", () => {
    it("should display error title and message for UnexpectedError", () => {
      const error = new UnexpectedError("Something went wrong");

      render(<ErrorFallback error={error} reset={mockReset} />);

      expect(
        screen.getByRole("heading", { name: /エラーが発生しました/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/予期しないエラーが発生しました/i)
      ).toBeInTheDocument();
    });

    it("should display network error message for NetworkError", () => {
      const error = new NetworkError(
        "Network failed",
        new Error("Original error")
      );

      render(<ErrorFallback error={error} reset={mockReset} />);

      expect(
        screen.getByRole("heading", { name: /ネットワークエラー/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/ネットワーク接続に問題が発生しました/i)
      ).toBeInTheDocument();
    });

    it("should display validation error with field errors", () => {
      const error = new ValidationError("Validation failed", 422, {
        email: ["メールアドレスの形式が正しくありません"],
        password: ["パスワードは8文字以上必要です"],
      });

      render(<ErrorFallback error={error} reset={mockReset} />);

      expect(
        screen.getByRole("heading", { name: /入力エラー/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/メールアドレスの形式が正しくありません/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/パスワードは8文字以上必要です/i)
      ).toBeInTheDocument();
    });

    it("should display generic error for standard Error", () => {
      const error = new Error("Standard error message");

      render(<ErrorFallback error={error} reset={mockReset} />);

      expect(
        screen.getByRole("heading", { name: /エラーが発生しました/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Standard error message/i)).toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("should display retry button and call reset on click", () => {
      const error = new NetworkError(
        "Network failed",
        new Error("Original error")
      );

      render(<ErrorFallback error={error} reset={mockReset} />);

      const retryButton = screen.getByRole("button", { name: /再試行/i });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it("should display home button", () => {
      const error = new UnexpectedError("Something went wrong");

      render(<ErrorFallback error={error} reset={mockReset} />);

      const homeButton = screen.getByRole("button", { name: /ホームに戻る/i });
      expect(homeButton).toBeInTheDocument();
    });
  });

  describe("Development Mode", () => {
    it("should display error details in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at TestFunction (test.js:10:15)";

      render(
        <ErrorFallback error={error} reset={mockReset} showDetails={true} />
      );

      // エラー詳細セクションが表示される
      expect(screen.getByText(/エラー詳細/i)).toBeInTheDocument();
      expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it("should not display error details in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at TestFunction (test.js:10:15)";

      render(
        <ErrorFallback error={error} reset={mockReset} showDetails={false} />
      );

      // エラー詳細セクションが表示されない
      expect(screen.queryByText(/エラー詳細/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/at TestFunction/)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Styling and Layout", () => {
    it("should have appropriate styling classes", () => {
      const error = new UnexpectedError("Something went wrong");

      const { container } = render(
        <ErrorFallback error={error} reset={mockReset} />
      );

      // Tailwind classes for centering and spacing
      expect(container.firstChild).toHaveClass("min-h-screen");
      expect(container.querySelector(".max-w-md")).toBeInTheDocument();
    });

    it("should display error icon", () => {
      const error = new UnexpectedError("Something went wrong");

      render(<ErrorFallback error={error} reset={mockReset} />);

      // アイコンのaria-label または role で確認
      const icon = screen.getByRole("img", { hidden: true });
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      const error = new UnexpectedError("Something went wrong");

      render(<ErrorFallback error={error} reset={mockReset} />);

      // role="alert" for error messages
      const alertElement = screen.getByRole("alert");
      expect(alertElement).toBeInTheDocument();
    });

    it("should have proper heading hierarchy", () => {
      const error = new UnexpectedError("Something went wrong");

      render(<ErrorFallback error={error} reset={mockReset} />);

      const headings = screen.getAllByRole("heading");
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0]).toHaveProperty("tagName", "H1");
    });
  });

  describe("Custom Messages", () => {
    it("should allow custom title and description", () => {
      const error = new UnexpectedError("Something went wrong");

      render(
        <ErrorFallback
          description="カスタム説明文"
          error={error}
          reset={mockReset}
          title="カスタムタイトル"
        />
      );

      expect(
        screen.getByRole("heading", { name: /カスタムタイトル/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/カスタム説明文/i)).toBeInTheDocument();
    });
  });
});
