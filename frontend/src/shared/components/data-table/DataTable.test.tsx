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

describe("DataTable", () => {
  it("データを正しく表示する", () => {
    render(<DataTable columns={columns} data={mockData} />);

    // データが表示されることを確認
    expect(screen.getByText("田中太郎")).toBeInTheDocument();
    expect(screen.getByText("佐藤花子")).toBeInTheDocument();
    expect(screen.getByText("鈴木一郎")).toBeInTheDocument();
  });

  it("空データ時にメッセージを表示する", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="データが見つかりません"
      />
    );

    expect(screen.getByText("データが見つかりません")).toBeInTheDocument();
  });

  it("グローバルフィルターが機能する", async () => {
    const user = userEvent.setup();

    render(<DataTable columns={columns} data={mockData} enableGlobalFilter />);

    const searchInput = screen.getByPlaceholderText("検索...");
    await user.type(searchInput, "田中");

    // フィルタリング結果を確認
    expect(screen.getByText("田中太郎")).toBeInTheDocument();
    expect(screen.queryByText("佐藤花子")).not.toBeInTheDocument();
    expect(screen.queryByText("鈴木一郎")).not.toBeInTheDocument();
  });

  it("ローディング状態を表示する", () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} loading />
    );

    // Skeletonコンポーネントが表示されることを確認
    const skeletons = container.querySelectorAll(".h-12.w-full");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("ページネーションが機能する", () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      age: 20 + i,
      email: `user${i + 1}@example.com`,
    }));

    render(<DataTable columns={columns} data={largeData} />);

    // デフォルトで最初の10件が表示される
    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.getByText("User 10")).toBeInTheDocument();
    expect(screen.queryByText("User 11")).not.toBeInTheDocument();

    // ページネーション情報が表示される
    expect(screen.getByText(/1 \/ \d+ ページ/)).toBeInTheDocument();
  });

  it("行選択が機能する", async () => {
    const user = userEvent.setup();
    const onRowSelectionChange = vi.fn();

    const selectableColumns: ColumnDef<Person>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <input
            checked={table.getIsAllRowsSelected()}
            onChange={(e) => table.toggleAllRowsSelected(e.target.checked)}
            type="checkbox"
          />
        ),
        cell: ({ row }) => (
          <input
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            type="checkbox"
          />
        ),
      },
      ...columns,
    ];

    render(
      <DataTable
        columns={selectableColumns}
        data={mockData}
        enableRowSelection
        onRowSelectionChange={onRowSelectionChange}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    const firstRowCheckbox = checkboxes[1];
    expect(firstRowCheckbox).toBeDefined();
    if (!firstRowCheckbox) return;

    await user.click(firstRowCheckbox); // 最初のデータ行を選択

    expect(onRowSelectionChange).toHaveBeenCalledWith({
      "0": true,
    });
  });
});
