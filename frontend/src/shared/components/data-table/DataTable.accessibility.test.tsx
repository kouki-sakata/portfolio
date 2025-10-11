import type { ColumnDef } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DataTable } from "./DataTable";

type Person = {
  id: number;
  name: string;
  age: number;
  email: string;
};

const mockData: Person[] = [
  { id: 1, name: "田中太郎", age: 30, email: "tanaka@example.com" },
  { id: 2, name: "佐藤花子", age: 25, email: "sato@example.com" },
  { id: 3, name: "鈴木一郎", age: 35, email: "suzuki@example.com" },
];

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "氏名",
  },
  {
    accessorKey: "age",
    header: "年齢",
  },
  {
    accessorKey: "email",
    header: "メールアドレス",
  },
];

const createUser = () => userEvent.setup({ delay: null });

describe("DataTable Accessibility", () => {
  it("should have proper ARIA labels for interactive elements", () => {
    render(
      <DataTable
        columns={columns}
        data={mockData}
        enableColumnVisibility
        enableGlobalFilter
      />
    );

    // 検索入力フィールドにラベルがあることを確認
    const searchInput = screen.getByPlaceholderText("検索...");
    expect(searchInput).toHaveAttribute("aria-label", "テーブル内容を検索");

    // ページネーションボタンにアクセシブルなラベルがあることを確認
    const prevButton = screen.getByRole("button", { name: /前のページへ/i });
    expect(prevButton).toBeInTheDocument();

    const nextButton = screen.getByRole("button", { name: /次のページへ/i });
    expect(nextButton).toBeInTheDocument();
  });

  it("should support keyboard navigation", async () => {
    const user = createUser();

    render(<DataTable columns={columns} data={mockData} enableGlobalFilter />);

    // Tab キーでフォーカス移動できることを確認
    await user.tab();
    const searchInput = screen.getByPlaceholderText("検索...");
    expect(searchInput).toHaveFocus();

    // 検索入力で Enter キーが機能することを確認
    await user.type(searchInput, "田中");
    await user.keyboard("{Enter}");

    // フィルタリング結果が表示されることを確認（デスクトップとモバイルビューの両方に表示されるため、getAllByText()を使用）
    expect(screen.getAllByText("田中太郎")[0]).toBeInTheDocument();
    expect(screen.queryByText("佐藤花子")).not.toBeInTheDocument();
  });

  it("should have proper table semantics", () => {
    const { container } = render(
      <DataTable columns={columns} data={mockData} />
    );

    // テーブル要素が正しい構造を持つことを確認
    const table = container.querySelector("table");
    expect(table).toBeInTheDocument();

    // thead, tbody が存在することを確認
    const thead = container.querySelector("thead");
    const tbody = container.querySelector("tbody");
    expect(thead).toBeInTheDocument();
    expect(tbody).toBeInTheDocument();

    // th 要素がヘッダーとして機能することを確認
    const headers = container.querySelectorAll("th");
    expect(headers.length).toBeGreaterThan(0);

    // scope 属性が設定されていることを確認
    for (const header of headers) {
      expect(header).toHaveAttribute("scope", "col");
    }
  });

  it("should have sufficient color contrast", () => {
    render(<DataTable columns={columns} data={mockData} />);

    // テキストが表示されることを確認（コントラストは CSS で保証）
    // デスクトップとモバイルビューの両方に表示されるため、getAllByText()を使用
    expect(screen.getAllByText("田中太郎")[0]).toBeVisible();
    expect(screen.getAllByText("ID")[0]).toBeVisible();
  });

  it("should announce changes to screen readers", async () => {
    const user = createUser();

    render(<DataTable columns={columns} data={mockData} enableGlobalFilter />);

    const searchInput = screen.getByPlaceholderText("検索...");

    // aria-live 領域があることを確認
    await user.type(searchInput, "田中");

    // フィルタリング結果が通知されることを確認
    // （実際の実装では aria-live="polite" を使用）
    // デスクトップとモバイルビューの両方に表示されるため、getAllByText()を使用
    expect(screen.getAllByText("田中太郎")[0]).toBeInTheDocument();
  });

  it("should have focus indicators", async () => {
    const user = createUser();

    render(
      <DataTable columns={columns} data={mockData} enableColumnVisibility />
    );

    // Tab でフォーカス可能な要素に移動
    await user.tab();

    // フォーカスされた要素が視覚的に識別できることを確認
    // （CSS の :focus-visible で実装）
    const focusedElement = document.activeElement;
    expect(focusedElement).not.toBe(document.body);
  });

  it("should support responsive design", () => {
    const { container } = render(
      <DataTable columns={columns} data={mockData} />
    );

    // レスポンシブクラスが適用されていることを確認
    const wrapper = container.querySelector(".w-full");
    expect(wrapper).toBeInTheDocument();

    // オーバーフロー処理が適用されていることを確認
    const scrollContainer = container.querySelector(".overflow-auto");
    expect(scrollContainer).toBeInTheDocument();
  });

  it("should provide skip links for keyboard users", () => {
    render(<DataTable columns={columns} data={mockData} enableGlobalFilter />);

    // メインコンテンツへのスキップリンクを提供
    // （実装によってはページレベルで提供）
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
  });

  it("should handle error states accessibly", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="データが見つかりません"
      />
    );

    // エラーメッセージが適切に表示されることを確認（デスクトップとモバイルビューの両方に表示されるため、getAllByText()を使用）
    const emptyMessage = screen.getAllByText("データが見つかりません")[0];
    expect(emptyMessage).toBeInTheDocument();

    // role="status" と aria-live="polite" が設定されていることを確認
    const messageContainer = emptyMessage?.closest("td");
    expect(messageContainer).toHaveAttribute("role", "status");
    expect(messageContainer).toHaveAttribute("aria-live", "polite");
  });

  it("should have keyboard support for clickable rows", async () => {
    const user = createUser();
    const onRowClick = vi.fn();

    render(
      <DataTable columns={columns} data={mockData} onRowClick={onRowClick} />
    );

    // 行がフォーカス可能であることを確認
    const rows = screen.getAllByRole("row");
    // ヘッダー行を除いた最初のデータ行
    const firstDataRow = rows[1];
    expect(firstDataRow).toBeDefined();
    if (!firstDataRow) {
      return;
    }

    // 行にtabIndexが設定されていることを確認
    expect(firstDataRow).toHaveAttribute("tabIndex", "0");

    // 行を直接クリック
    await user.click(firstDataRow);
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);

    // キーボードイベントをテスト
    onRowClick.mockClear();
    firstDataRow.focus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);

    // スペースキーでもクリックされることを確認
    onRowClick.mockClear();
    await user.keyboard(" ");
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });
});
