import type { ColumnDef } from "@tanstack/react-table";
import type { CSSProperties, SyntheticEvent } from "react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getNewsCategoryBadgeVariant } from "@/features/news/lib/categoryBadge";
import type { NewsViewModel } from "@/features/news/lib/newsViewModel";
import { DataTableColumnHeader } from "@/shared/components/data-table";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";

const multiLineClampStyle = {
  display: "-webkit-box",
  ["WebkitLineClamp" as const]: 2,
  ["WebkitBoxOrient" as const]: "vertical",
} satisfies CSSProperties;

const stopPropagation = (event: SyntheticEvent) => {
  event.stopPropagation();
};

type UseNewsColumnsProps = {
  onEdit?: (news: NewsViewModel) => void;
  onDeleteClick?: (news: NewsViewModel) => void;
};

export function useNewsColumns({
  onEdit,
  onDeleteClick,
}: UseNewsColumnsProps = {}) {
  return useMemo<ColumnDef<NewsViewModel>[]>(
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
            onClick={stopPropagation}
            onKeyDown={stopPropagation}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`${row.original.newsDate}のお知らせを選択`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={stopPropagation}
            onKeyDown={stopPropagation}
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
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="タイトル" />
        ),
        cell: ({ row }) => {
          const title = row.getValue("title") as string;
          return (
            <div className="max-w-[200px] truncate font-medium md:max-w-[300px]">
              {title || (
                <span className="text-muted-foreground italic">
                  タイトル未設定
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "content",
        header: "内容",
        cell: ({ row }) => {
          const content = row.getValue("content") as string;

          return (
            <div
              className="max-w-[300px] overflow-hidden text-ellipsis md:max-w-[500px]"
              style={multiLineClampStyle}
            >
              {content}
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="カテゴリ" />
        ),
        cell: ({ row }) => {
          const category = row.getValue("category") as string;
          if (!category) {
            return (
              <span className="text-muted-foreground italic">
                カテゴリ未設定
              </span>
            );
          }

          return (
            <Badge
              contrastLevel="aa"
              variant={getNewsCategoryBadgeVariant(category)}
            >
              {category}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          if (value === "all") {
            return true;
          }
          return row.getValue(id) === value;
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
            <Badge
              contrastLevel="aa"
              variant={isPublished ? "default" : "secondary"}
            >
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
                  aria-label="編集"
                  className="px-2 md:px-3"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(news);
                  }}
                  onKeyDown={stopPropagation}
                  size="sm"
                  type="button"
                  variant="default"
                >
                  <SpriteIcon
                    className="h-4 w-4 md:hidden"
                    decorative
                    name="edit"
                  />
                  <span className="hidden md:inline">編集</span>
                </Button>
              )}
              {onDeleteClick && (
                <Button
                  aria-label="削除"
                  className="px-2 md:px-3"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteClick(news);
                  }}
                  onKeyDown={stopPropagation}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  <SpriteIcon
                    className="h-4 w-4 md:hidden"
                    decorative
                    name="trash-2"
                  />
                  <span className="hidden md:inline">削除</span>
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
