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

interface NewsDetailDialogProps {
  news: NewsResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (news: NewsResponse) => void;
  onDelete: (news: NewsResponse) => void;
}

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[600px] max-w-[95vw] min-h-[400px] max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* ヘッダーセクション - 固定 */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border">
          <DialogHeader className="space-y-3 text-left">
            {/* カテゴリーバッジ */}
            <div>
              <Badge
                variant={getCategoryVariant(news.category)}
                className="text-xs px-3 py-1 font-medium"
              >
                {news.category}
              </Badge>
            </div>

            {/* タイトル - 折り返し対応 */}
            <DialogTitle className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight break-words">
              {news.title}
            </DialogTitle>

            {/* メタデータ */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
                variant={news.releaseFlag ? "default" : "secondary"}
                className="text-xs"
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
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-sm sm:text-base leading-relaxed text-foreground whitespace-pre-wrap break-words overflow-wrap-anywhere">
              {news.content}
            </p>
          </div>
        </div>

        {/* フッターセクション - 固定 */}
        <div className="flex-shrink-0 flex flex-wrap justify-end gap-2 border-t border-border bg-muted/30 px-6 py-4">
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
            size="sm"
            className="order-3 sm:order-1"
          >
            <X className="mr-2 h-4 w-4" />
            閉じる
          </Button>

          <Button
            onClick={handleEdit}
            type="button"
            variant="default"
            size="sm"
            className="order-1 sm:order-2"
          >
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>

          <Button
            onClick={handleDelete}
            type="button"
            variant="destructive"
            size="sm"
            className="order-2 sm:order-3"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
