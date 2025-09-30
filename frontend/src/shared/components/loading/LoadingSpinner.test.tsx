import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  describe("基本動作", () => {
    it("正しくレンダリングされること", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
    });

    it("デフォルトのaria-labelが設定されること", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-label", "読み込み中");
    });

    it("カスタムaria-labelが設定できること", () => {
      render(<LoadingSpinner label="データを取得中" />);
      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-label", "データを取得中");
    });

    it("スピナーアイコンが表示されること", () => {
      render(<LoadingSpinner />);
      const icon = screen.getByTestId("loading-spinner-icon");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("サイズバリアント", () => {
    it("smサイズが適用されること", () => {
      render(<LoadingSpinner size="sm" />);
      const icon = screen.getByTestId("loading-spinner-icon");
      expect(icon).toHaveClass("size-4");
    });

    it("mdサイズが適用されること（デフォルト）", () => {
      render(<LoadingSpinner size="md" />);
      const icon = screen.getByTestId("loading-spinner-icon");
      expect(icon).toHaveClass("size-6");
    });

    it("lgサイズが適用されること", () => {
      render(<LoadingSpinner size="lg" />);
      const icon = screen.getByTestId("loading-spinner-icon");
      expect(icon).toHaveClass("size-8");
    });

    it("xlサイズが適用されること", () => {
      render(<LoadingSpinner size="xl" />);
      const icon = screen.getByTestId("loading-spinner-icon");
      expect(icon).toHaveClass("size-12");
    });
  });

  describe("テキスト表示", () => {
    it("showTextがtrueの場合、ラベルテキストが表示されること", () => {
      render(<LoadingSpinner showText />);
      expect(screen.getByText("読み込み中")).toBeInTheDocument();
    });

    it("showTextがfalseの場合、ラベルテキストが表示されないこと", () => {
      render(<LoadingSpinner showText={false} />);
      expect(screen.queryByText("読み込み中")).not.toBeInTheDocument();
    });

    it("カスタムラベルテキストが表示されること", () => {
      render(<LoadingSpinner label="処理中です" showText />);
      expect(screen.getByText("処理中です")).toBeInTheDocument();
    });
  });

  describe("カラーバリアント", () => {
    it("primaryカラーが適用されること", () => {
      render(<LoadingSpinner variant="primary" />);
      const icon = screen.getByTestId("loading-spinner-icon");
      expect(icon).toHaveClass("text-primary");
    });

    it("secondaryカラーが適用されること", () => {
      render(<LoadingSpinner variant="secondary" />);
      const icon = screen.getByTestId("loading-spinner-icon");
      expect(icon).toHaveClass("text-muted-foreground");
    });

    it("destructiveカラーが適用されること", () => {
      render(<LoadingSpinner variant="destructive" />);
      const icon = screen.getByTestId("loading-spinner-icon");
      expect(icon).toHaveClass("text-destructive");
    });
  });

  describe("配置", () => {
    it("fullScreenがtrueの場合、フルスクリーン表示されること", () => {
      render(<LoadingSpinner fullScreen />);
      const container = screen.getByTestId("loading-spinner-container");
      expect(container).toHaveClass("fixed", "inset-0");
    });

    it("centerがtrueの場合、中央寄せ表示されること", () => {
      render(<LoadingSpinner center />);
      const container = screen.getByTestId("loading-spinner-container");
      expect(container).toHaveClass("flex", "items-center", "justify-center");
    });
  });

  describe("アニメーション", () => {
    it("スピンアニメーションが適用されること", () => {
      render(<LoadingSpinner />);
      const icon = screen.getByTestId("loading-spinner-icon");
      expect(icon).toHaveClass("animate-spin");
    });
  });

  describe("カスタムクラス", () => {
    it("カスタムclassNameが適用されること", () => {
      render(<LoadingSpinner className="custom-class" />);
      const container = screen.getByTestId("loading-spinner-container");
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("アクセシビリティ", () => {
    it("aria-busyが設定されること", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-busy", "true");
    });

    it("aria-liveがpoliteに設定されること", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-live", "polite");
    });
  });
});
