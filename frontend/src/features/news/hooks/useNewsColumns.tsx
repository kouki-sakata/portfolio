import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTableColumnHeader } from "@/shared/components/data-table";
import { cn } from "@/shared/utils/cn";
import type { NewsResponse } from "@/types";

type UseNewsColumnsProps = {
  onEdit?: (news: NewsResponse) => void;
  onDeleteClick?: (news: NewsResponse) => void;
};

export function useNewsColumns({
  onEdit,
  onDeleteClick,
}: UseNewsColumnsProps = {}) {
  return useMemo<ColumnDef<NewsResponse>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="全て選択"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`${row.original.newsDate}のお知らせを選択`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "newsDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="日付" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("newsDate")}</div>
        ),
      },
      {
        accessorKey: "content",
        header: "内容",
        cell: ({ row }) => {
          const content = row.getValue("content") as string;
          const shouldTruncate = content.length > 50; // 50文字以上で省略

          return (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "max-w-[300px] md:max-w-[500px]",
                      shouldTruncate && "truncate cursor-help"
                    )}
                  >
                    {content}
                  </div>
                </TooltipTrigger>
                {shouldTruncate && (
                  <TooltipContent
                    className="max-w-[400px] break-words whitespace-pre-wrap"
                    side="bottom"
                  >
                    <p className="text-sm">{content}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        accessorKey: "releaseFlag",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="ステータス" />
        ),
        cell: ({ row }) => {
          const isPublished = row.getValue("releaseFlag") as boolean;
          return (
            <Badge variant={isPublished ? "default" : "secondary"}>
              {isPublished ? "公開中" : "下書き"}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          if (value === "all") {
            return true;
          }
          if (value === "published") {
            return row.getValue(id) === true;
          }
          if (value === "draft") {
            return row.getValue(id) === false;
          }
          return true;
        },
        sortingFn: (rowA, rowB) => {
          const a = rowA.getValue("releaseFlag") as boolean;
          const b = rowB.getValue("releaseFlag") as boolean;
          if (a === b) {
            return 0;
          }
          return a ? -1 : 1;
        },
      },
      {
        accessorKey: "updateDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="最終更新" />
        ),
        cell: ({ row }) => {
          const updateDate = row.getValue("updateDate") as string;
          return (
            <div className="text-muted-foreground text-sm">
              {new Date(updateDate).toLocaleString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "アクション",
        cell: ({ row }) => {
          const news = row.original;

          return (
            <div className="flex items-center gap-1 md:gap-2">
              {onEdit && (
                <Button
                  className="px-2 md:px-3"
                  onClick={() => onEdit(news)}
                  size="sm"
                  type="button"
                  variant="default"
                >
                  <span className="hidden md:inline">編集</span>
                  <span className="md:hidden">✏️</span>
                </Button>
              )}
              {onDeleteClick && (
                <Button
                  className="px-2 md:px-3"
                  onClick={() => onDeleteClick(news)}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  <span className="hidden md:inline">削除</span>
                  <span className="md:hidden">🗑️</span>
                </Button>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onEdit, onDeleteClick]
  );
}
