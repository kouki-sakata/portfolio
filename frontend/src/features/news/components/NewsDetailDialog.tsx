import { CalendarDays, Edit, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NewsResponse } from "@/types";

type NewsDetailDialogProps = {
  news: NewsResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (news: NewsResponse) => void;
  onDelete: (news: NewsResponse) => void;
};

export const NewsDetailDialog = ({
  news,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: NewsDetailDialogProps) => {
  if (!news) {
    return null;
  }

  const getCategoryVariant = (
    category: string
  ): "destructive" | "default" | "secondary" => {
    if (category === "重要") {
      return "destructive";
    }
    if (category === "システム") {
      return "default";
    }
    return "secondary";
  };

  const handleEdit = () => {
    onEdit(news);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(news);
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex max-h-[70vh] min-h-[300px] w-[600px] max-w-[70vw] flex-col gap-0 overflow-hidden p-0">
        {/* ヘッダーセクション - 固定 */}
        <div className="flex-shrink-0 border-border border-b px-6 py-4">
          <DialogHeader className="space-y-3 text-left">
            {/* カテゴリーバッジ */}
            <div>
              <Badge
                className="px-3 py-1 font-medium text-xs"
                variant={getCategoryVariant(news.category)}
              >
                {news.category}
              </Badge>
            </div>

            {/* タイトル - 折り返し対応 */}
            <DialogTitle className="break-words font-bold text-2xl leading-tight tracking-tight sm:text-3xl">
              {news.title}
            </DialogTitle>

            {/* メタデータ */}
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                <time dateTime={news.newsDate}>
                  {new Date(news.newsDate).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <Badge
                className="text-xs"
                variant={news.releaseFlag ? "default" : "secondary"}
              >
                {news.releaseFlag ? "公開" : "下書き"}
              </Badge>
            </div>

            {/* スクリーンリーダー用説明 */}
            <DialogDescription className="sr-only">
              {news.content.substring(0, 120)}...
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* 本文セクション - 動的高さ */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="overflow-wrap-anywhere whitespace-pre-wrap break-words text-foreground text-sm leading-relaxed sm:text-base">
              {news.content}
            </p>
          </div>
        </div>

        {/* フッターセクション - 固定 */}
        <div className="flex flex-shrink-0 flex-wrap justify-end gap-2 border-border border-t bg-muted/30 px-6 py-4">
          <Button
            className="order-3 sm:order-1"
            onClick={() => onOpenChange(false)}
            size="sm"
            type="button"
            variant="outline"
          >
            <X className="mr-2 h-4 w-4" />
            閉じる
          </Button>

          <Button
            className="order-1 sm:order-2"
            onClick={handleEdit}
            size="sm"
            type="button"
            variant="default"
          >
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>

          <Button
            className="order-2 sm:order-3"
            onClick={handleDelete}
            size="sm"
            type="button"
            variant="destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
