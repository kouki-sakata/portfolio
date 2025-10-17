import type { Row } from "@tanstack/react-table";
import { Edit, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTogglePublishMutation } from "@/features/news/hooks/useNews";
import type { NewsResponse } from "@/types";

import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

type NewsTableRowActionsProps = {
  row: Row<NewsResponse>;
};

export const NewsTableRowActions = ({ row }: NewsTableRowActionsProps) => {
  const news = row.original;
  const toggleMutation = useTogglePublishMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleTogglePublish = async () => {
    await toggleMutation.mutateAsync({
      id: news.id,
      releaseFlag: !news.releaseFlag,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-haspopup="true"
            aria-label={`${news.newsDate}のお知らせのアクションメニュー`}
            className="h-8 w-8 p-0"
            type="button"
            variant="ghost"
          >
            <span className="sr-only">アクションメニューを開く</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>アクション</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              // 編集機能は親コンポーネントで処理
              // イベントをバブルアップさせる
              const event = new CustomEvent("news:edit", {
                detail: news,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            編集
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={toggleMutation.isPending}
            onClick={handleTogglePublish}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {news.releaseFlag ? "非公開にする" : "公開する"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog
        news={news}
        onOpenChange={setShowDeleteDialog}
        open={showDeleteDialog}
        type="single"
      />
    </>
  );
};
