import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  pageSizeOptions?: number[];
};

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
}: DataTablePaginationProps<TData>) {
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;

  return (
    <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
      {/* 選択状態表示 */}
      <div className="flex-1 text-center text-muted-foreground text-sm sm:text-left">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <span>
            {table.getFilteredSelectedRowModel().rows.length} /{" "}
            {table.getFilteredRowModel().rows.length} 件選択中
          </span>
        )}
      </div>

      {/* ページネーションコントロール */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:space-x-6 lg:space-x-8">
        {/* 表示件数選択 */}
        <div className="flex items-center space-x-2">
          <p className="hidden font-medium text-sm sm:block">表示件数</p>
          <p className="font-medium text-sm sm:hidden">件数</p>
          <Select
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
            value={`${pageSize}`}
          >
            <SelectTrigger className="h-9 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ページ情報 */}
        <div className="flex min-w-[100px] items-center justify-center font-medium text-sm">
          {currentPage} / {pageCount} ページ
        </div>

        {/* ページ送りボタン */}
        <div className="flex items-center space-x-2">
          <Button
            aria-label="最初のページへ"
            className="hidden size-9 p-0 lg:flex"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
            variant="outline"
          >
            <span className="sr-only">最初のページへ</span>
            <SpriteIcon className="size-4" decorative name="chevrons-left" />
          </Button>
          <Button
            aria-label="前のページへ"
            className="size-9 p-0"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            variant="outline"
          >
            <span className="sr-only">前のページへ</span>
            <SpriteIcon className="size-4" decorative name="chevron-left" />
          </Button>
          <Button
            aria-label="次のページへ"
            className="size-9 p-0"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            variant="outline"
          >
            <span className="sr-only">次のページへ</span>
            <SpriteIcon className="size-4" decorative name="chevron-right" />
          </Button>
          <Button
            aria-label="最後のページへ"
            className="hidden size-9 p-0 lg:flex"
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            variant="outline"
          >
            <span className="sr-only">最後のページへ</span>
            <SpriteIcon className="size-4" decorative name="chevrons-right" />
          </Button>
        </div>
      </div>
    </div>
  );
}
