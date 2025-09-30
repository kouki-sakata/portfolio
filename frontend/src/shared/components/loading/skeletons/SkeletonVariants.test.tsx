import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  SkeletonCard,
  SkeletonForm,
  SkeletonTable,
  SkeletonText,
} from "./SkeletonVariants";

describe("SkeletonCard", () => {
  it("カードスケルトンがレンダリングされること", () => {
    render(<SkeletonCard />);
    const card = screen.getByTestId("skeleton-card");
    expect(card).toBeInTheDocument();
  });

  it("ヘッダー、コンテンツ、フッターのスケルトンが含まれること", () => {
    render(<SkeletonCard />);
    expect(screen.getByTestId("skeleton-card-header")).toBeInTheDocument();
    expect(screen.getByTestId("skeleton-card-content")).toBeInTheDocument();
    expect(screen.getByTestId("skeleton-card-footer")).toBeInTheDocument();
  });

  it("showFooterがfalseの場合フッターが表示されないこと", () => {
    render(<SkeletonCard showFooter={false} />);
    expect(
      screen.queryByTestId("skeleton-card-footer")
    ).not.toBeInTheDocument();
  });

  it("カスタムクラスが適用されること", () => {
    render(<SkeletonCard className="custom-class" />);
    const card = screen.getByTestId("skeleton-card");
    expect(card).toHaveClass("custom-class");
  });
});

describe("SkeletonTable", () => {
  it("テーブルスケルトンがレンダリングされること", () => {
    render(<SkeletonTable />);
    const table = screen.getByTestId("skeleton-table");
    expect(table).toBeInTheDocument();
  });

  it("指定した行数のスケルトンが表示されること", () => {
    render(<SkeletonTable rows={5} />);
    const rows = screen.getAllByTestId(/skeleton-table-row-/);
    expect(rows).toHaveLength(5);
  });

  it("指定した列数のスケルトンが各行に表示されること", () => {
    render(<SkeletonTable columns={4} rows={2} />);
    const row1Cells = screen
      .getByTestId("skeleton-table-row-0")
      .querySelectorAll('[data-testid^="skeleton-table-cell"]');
    expect(row1Cells).toHaveLength(4);
  });

  it("ヘッダー行が表示されること", () => {
    render(<SkeletonTable showHeader />);
    expect(screen.getByTestId("skeleton-table-header")).toBeInTheDocument();
  });

  it("デフォルトで3行5列が表示されること", () => {
    render(<SkeletonTable />);
    const rows = screen.getAllByTestId(/skeleton-table-row-/);
    expect(rows).toHaveLength(3);
    const cells = rows[0].querySelectorAll(
      '[data-testid^="skeleton-table-cell"]'
    );
    expect(cells).toHaveLength(5);
  });
});

describe("SkeletonForm", () => {
  it("フォームスケルトンがレンダリングされること", () => {
    render(<SkeletonForm />);
    const form = screen.getByTestId("skeleton-form");
    expect(form).toBeInTheDocument();
  });

  it("指定したフィールド数のスケルトンが表示されること", () => {
    render(<SkeletonForm fields={4} />);
    const fields = screen.getAllByTestId(/skeleton-form-field-/);
    expect(fields).toHaveLength(4);
  });

  it("各フィールドにラベルと入力要素のスケルトンが含まれること", () => {
    render(<SkeletonForm fields={1} />);
    const field = screen.getByTestId("skeleton-form-field-0");
    expect(
      field.querySelector('[data-testid="skeleton-form-label-0"]')
    ).toBeInTheDocument();
    expect(
      field.querySelector('[data-testid="skeleton-form-input-0"]')
    ).toBeInTheDocument();
  });

  it("ボタンが表示されること", () => {
    render(<SkeletonForm showButton />);
    expect(screen.getByTestId("skeleton-form-button")).toBeInTheDocument();
  });

  it("デフォルトで3フィールドが表示されること", () => {
    render(<SkeletonForm />);
    const fields = screen.getAllByTestId(/skeleton-form-field-/);
    expect(fields).toHaveLength(3);
  });
});

describe("SkeletonText", () => {
  it("テキストスケルトンがレンダリングされること", () => {
    render(<SkeletonText />);
    const text = screen.getByTestId("skeleton-text");
    expect(text).toBeInTheDocument();
  });

  it("指定した行数のスケルトンが表示されること", () => {
    render(<SkeletonText lines={5} />);
    const lines = screen.getAllByTestId(/skeleton-text-line-/);
    expect(lines).toHaveLength(5);
  });

  it("ランダムな幅が各行に適用されること", () => {
    render(<SkeletonText lines={3} randomWidth />);
    const lines = screen.getAllByTestId(/skeleton-text-line-/);
    const widths = lines.map((line) => line.className);
    // 全ての行が同じ幅ではないことを確認
    expect(new Set(widths).size).toBeGreaterThan(1);
  });

  it("見出しサイズが適用されること", () => {
    render(<SkeletonText variant="heading" />);
    const line = screen.getByTestId("skeleton-text-line-0");
    expect(line).toHaveClass("h-8");
  });

  it("小サイズが適用されること", () => {
    render(<SkeletonText variant="small" />);
    const line = screen.getByTestId("skeleton-text-line-0");
    expect(line).toHaveClass("h-3");
  });

  it("デフォルトで3行が表示されること", () => {
    render(<SkeletonText />);
    const lines = screen.getAllByTestId(/skeleton-text-line-/);
    expect(lines).toHaveLength(3);
  });
});
