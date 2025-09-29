import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableViewOptions } from "./DataTableViewOptions";
import type { DataTableProps, DataTableState } from "./types";

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  pagination: controlledPagination,
  onPaginationChange,
  totalCount,
  loading = false,
  enableRowSelection = false,
  onRowSelectionChange,
  enableGlobalFilter = true,
  enableColumnVisibility = true,
  fixedHeight,
  emptyMessage = "データがありません",
  onRowClick,
}: DataTableProps<TData, TValue>) {
  // テーブル状態の管理
  const [state, setState] = useState<DataTableState>({
    sorting: [],
    columnFilters: [],
    columnVisibility: {},
    rowSelection: {},
    globalFilter: "",
  });

  // 内部ページネーション状態（コントロールされていない場合用）
  const [internalPagination, setInternalPagination] = useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize: 10,
    }
  );

  // 使用するページネーション状態を決定
  const pagination = controlledPagination || internalPagination;
  const setPagination = onPaginationChange || setInternalPagination;

  // TanStack Tableインスタンスの作成
  const table = useReactTable({
    data,
    columns,
    // Core
    getCoreRowModel: getCoreRowModel(),

    // Sorting
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) =>
      setState((prev) => ({
        ...prev,
        sorting:
          typeof updater === "function" ? updater(prev.sorting) : updater,
      })),

    // Filtering
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: (updater) =>
      setState((prev) => ({
        ...prev,
        columnFilters:
          typeof updater === "function" ? updater(prev.columnFilters) : updater,
      })),
    onGlobalFilterChange: (updater) =>
      setState((prev) => ({
        ...prev,
        globalFilter:
          typeof updater === "function" ? updater(prev.globalFilter) : updater,
      })),

    // Pagination
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    manualPagination: !!onPaginationChange, // サーバーサイドページネーション
    pageCount: totalCount
      ? Math.ceil(totalCount / pagination.pageSize)
      : undefined,

    // Row Selection
    enableRowSelection,
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === "function" ? updater(state.rowSelection) : updater;

      setState((prev) => ({
        ...prev,
        rowSelection: newSelection,
      }));

      onRowSelectionChange?.(newSelection);
    },

    // Column Visibility
    onColumnVisibilityChange: (updater) =>
      setState((prev) => ({
        ...prev,
        columnVisibility:
          typeof updater === "function"
            ? updater(prev.columnVisibility)
            : updater,
      })),

    // State
    state: {
      ...state,
      pagination,
    },
  });

  // ローディング時のスケルトン表示
  if (loading && data.length === 0) {
    return (
      <div className="w-full space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-12 w-full" key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* ツールバー */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {enableGlobalFilter && (
            <Input
              aria-label="テーブル内容を検索"
              className="h-8 w-[150px] lg:w-[250px]"
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              placeholder="検索..."
              value={state.globalFilter ?? ""}
            />
          )}
        </div>
        {enableColumnVisibility && <DataTableViewOptions table={table} />}
      </div>

      {/* テーブル本体 */}
      <div
        aria-label="データテーブル"
        className="relative w-full overflow-auto rounded-md border"
        role="region"
        style={fixedHeight ? { height: fixedHeight } : undefined}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className="whitespace-nowrap px-2 sm:px-3 md:px-4"
                    key={header.id}
                    scope="col"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className={`${row.getIsSelected() ? "bg-muted" : ""} ${
                    onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
                  }`}
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      className="whitespace-nowrap px-2 py-2 text-xs sm:px-3 sm:py-3 sm:text-sm md:px-4 md:py-4"
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  aria-live="polite"
                  className="h-24 text-center"
                  colSpan={columns.length}
                  role="status"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* ローディングオーバーレイ */}
        {loading && data.length > 0 && (
          <div
            aria-live="polite"
            className="absolute inset-0 flex items-center justify-center bg-background/50"
            role="status"
          >
            <div className="text-muted-foreground text-sm">読み込み中...</div>
          </div>
        )}
      </div>

      {/* ページネーション */}
      <DataTablePagination
        pageSizeOptions={[10, 20, 30, 40, 50]}
        table={table}
      />
    </div>
  );
}
