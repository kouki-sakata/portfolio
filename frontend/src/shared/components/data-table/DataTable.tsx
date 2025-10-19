import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { type KeyboardEvent, useMemo, useState } from "react";

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
import { cn } from "@/shared/utils/cn";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableViewOptions } from "./DataTableViewOptions";
import type { DataTableProps, DataTableState } from "./types";

/**
 * ヘッダーテキストを安全に取得するヘルパー関数
 * @param header - カラム定義のheaderプロパティ（string | function | ReactNode）
 * @returns ヘッダーのテキスト表現
 */
function extractHeaderText(header: unknown): string {
  if (typeof header === "string") {
    return header;
  }
  return "";
}

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

  // スケルトンローディング用の安定したID生成
  const skeletonIds = useMemo(
    () => Array.from({ length: 5 }, () => crypto.randomUUID()),
    []
  );

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
        {skeletonIds.map((id) => (
          <Skeleton className="h-12 w-full" key={id} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* ツールバー */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {enableGlobalFilter && (
            <Input
              aria-label="テーブル内容を検索"
              className="h-9 w-full sm:w-[200px] lg:w-[250px]"
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              placeholder="検索..."
              value={state.globalFilter ?? ""}
            />
          )}
        </div>
        {enableColumnVisibility && <DataTableViewOptions table={table} />}
      </div>

      {/* テーブル本体 - デスクトップビュー (lg以上) */}
      <section
        aria-label="データテーブル"
        className="relative hidden w-full overflow-auto rounded-md border lg:block"
        style={fixedHeight ? { height: fixedHeight } : undefined}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className="whitespace-nowrap px-3 md:px-4"
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
                      className="whitespace-nowrap px-3 py-3 text-sm md:px-4 md:py-4"
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
          >
            <div className="text-muted-foreground text-sm">読み込み中...</div>
          </div>
        )}
      </section>

      {/* モバイルカードビュー (lg未満) */}
      <section
        aria-label="データリスト"
        className="space-y-3 lg:hidden"
        style={
          fixedHeight ? { height: fixedHeight, overflowY: "auto" } : undefined
        }
      >
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const CardContent = (
              <div className="space-y-2">
                {row.getVisibleCells().map((cell) => {
                  const header = cell.column.columnDef.header;
                  const headerText = extractHeaderText(header);

                  return (
                    <div className="flex justify-between gap-4" key={cell.id}>
                      <div className="font-medium text-gray-700 text-sm">
                        {headerText || cell.column.id}
                      </div>
                      <div className="text-right text-gray-900 text-sm">
                        {(() => {
                          const cellContent = flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          );

                          // content列の場合は特別処理
                          if (
                            cell.column.id === "content" &&
                            typeof cellContent === "string"
                          ) {
                            return (
                              <div
                                className="max-w-[200px] truncate"
                                title={cellContent}
                              >
                                {cellContent}
                              </div>
                            );
                          }

                          return cellContent;
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            );

            // クリック可能な場合はbuttonとしてレンダリング
            if (onRowClick) {
              const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowClick(row.original);
                }
              };

              return (
                /* biome-ignore lint/a11y/useSemanticElements: ネストされた button を避けつつキーボード操作を支援する必要がある */
                <div
                  className={cn(
                    "w-full rounded-lg border bg-white p-4 text-left shadow-sm transition-shadow",
                    row.getIsSelected() && "border-blue-500 bg-blue-50",
                    "hover:shadow-md active:shadow-sm"
                  )}
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                  onClick={() => onRowClick(row.original)}
                  onKeyDown={handleKeyDown}
                  role="button"
                  tabIndex={0}
                >
                  {/* 行クリックと内部ボタン操作の両立のため div + role="button" を採用 */}
                  {CardContent}
                </div>
              );
            }

            // クリック不可の場合は通常のdivとしてレンダリング
            return (
              <div
                className={cn(
                  "rounded-lg border bg-white p-4 shadow-sm",
                  row.getIsSelected() && "border-blue-500 bg-blue-50"
                )}
                data-state={row.getIsSelected() && "selected"}
                key={row.id}
              >
                {CardContent}
              </div>
            );
          })
        ) : (
          <output
            aria-live="polite"
            className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-gray-50 text-center text-gray-500"
          >
            {emptyMessage}
          </output>
        )}

        {/* モバイルローディングオーバーレイ */}
        {loading && data.length > 0 && (
          <div
            aria-live="polite"
            className="flex items-center justify-center py-8 text-muted-foreground text-sm"
          >
            読み込み中...
          </div>
        )}
      </section>

      {/* ページネーション */}
      <DataTablePagination
        pageSizeOptions={[10, 20, 30, 40, 50]}
        table={table}
      />
    </div>
  );
}
