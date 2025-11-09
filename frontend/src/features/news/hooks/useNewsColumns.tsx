import type { ColumnDef } from "@tanstack/react-table";
import type { CSSProperties, SyntheticEvent } from "react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNewsCategoryBadgeVariant } from "@/features/news/lib/categoryBadge";
import type { NewsViewModel } from "@/features/news/lib/newsViewModel";
import {
  DataTableColumnHeader,
  DataTableSelectionCheckbox,
} from "@/shared/components/data-table";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";
import { useDateTimeFormatter } from "@/shared/hooks/useMemoizedDateFormatter";

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
  const formatDateTime = useDateTimeFormatter();

  return useMemo<ColumnDef<NewsViewModel>[]>(
    () => [
      {
        id: "select",
        size: 50,
        minSize: 50,
        maxSize: 50,
        header: ({ table }) => (
          <DataTableSelectionCheckbox
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
          <DataTableSelectionCheckbox
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
        size: 110,
        minSize: 90,
        maxSize: 130,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="日付" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("newsDate")}</div>
        ),
      },
      {
        accessorKey: "title",
        size: 200,
        minSize: 150,
        maxSize: 300,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="タイトル" />
        ),
        cell: ({ row }) => {
          const title = row.getValue("title") as string;
          return (
            <div className="truncate font-medium">
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
        size: 300,
        minSize: 200,
        maxSize: 500,
        header: "内容",
        cell: ({ row }) => {
          const content = row.getValue("content") as string;

          return (
            <div
              className="overflow-hidden text-ellipsis"
              style={multiLineClampStyle}
            >
              {content}
            </div>
          );
        },
      },
      {
        accessorKey: "labelDisplay",
        size: 110,
        minSize: 90,
        maxSize: 130,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="カテゴリ" />
        ),
        cell: ({ row }) => {
          const { label, labelDisplay } = row.original;

          return (
            <Badge
              contrastLevel="aa"
              variant={getNewsCategoryBadgeVariant(label)}
            >
              {labelDisplay}
            </Badge>
          );
        },
        filterFn: (row, _id, value) => {
          if (value === "all") {
            return true;
          }
          const label = row.original.label;
          if (value === "IMPORTANT" || value === "重要") {
            return label === "IMPORTANT";
          }
          if (value === "SYSTEM" || value === "システム") {
            return label === "SYSTEM";
          }
          if (value === "GENERAL" || value === "一般") {
            return label === "GENERAL";
          }
          return row.original.labelDisplay === value;
        },
      },
      {
        accessorKey: "releaseFlag",
        size: 110,
        minSize: 90,
        maxSize: 130,
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
        size: 150,
        minSize: 120,
        maxSize: 180,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="最終更新" />
        ),
        cell: ({ row }) => {
          const updateDate = row.getValue("updateDate") as string;
          return (
            <div className="text-muted-foreground text-sm">
              {formatDateTime(updateDate)}
            </div>
          );
        },
      },
      {
        id: "actions",
        size: 140,
        minSize: 120,
        maxSize: 160,
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
    [onEdit, onDeleteClick, formatDateTime]
  );
}
