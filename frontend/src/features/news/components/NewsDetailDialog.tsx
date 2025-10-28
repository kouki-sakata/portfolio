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
import { getNewsCategoryBadgeVariant } from "@/features/news/lib/categoryBadge";
import type { NewsViewModel } from "@/features/news/lib/newsViewModel";

type NewsDetailDialogProps = {
  news: NewsViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (news: NewsViewModel) => void;
  onDelete: (news: NewsViewModel) => void;
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
      <DialogContent className="sm:-translate-x-1/2 sm:-translate-y-1/2 top-0 left-0 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none bg-background p-0 sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[80vh] sm:w-full sm:max-w-2xl sm:rounded-lg">
        {/* ヘッダーセクション - 固定 */}
        <div className="flex-shrink-0 border-border border-b px-6 py-4">
          <DialogHeader className="space-y-3 text-left">
            {/* カテゴリーバッジ */}
            <div>
              <Badge
                className="px-3 py-1 font-medium text-xs"
                contrastLevel="aa"
                variant={getNewsCategoryBadgeVariant(news.category)}
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
                contrastLevel="aa"
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
            className="order-3 h-12 min-h-11 flex-1 sm:order-1 sm:h-9 sm:flex-none"
            onClick={() => onOpenChange(false)}
            size="sm"
            type="button"
            variant="outline"
          >
            <X className="mr-2 h-4 w-4" />
            閉じる
          </Button>

          <Button
            className="order-1 h-12 min-h-11 flex-1 sm:order-2 sm:h-9 sm:flex-none"
            onClick={handleEdit}
            size="sm"
            type="button"
            variant="default"
          >
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>

          <Button
            className="order-2 h-12 min-h-11 flex-1 sm:order-3 sm:h-9 sm:flex-none"
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
