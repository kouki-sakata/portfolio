import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteNewsMutation } from "@/features/news/hooks/useNews";
import type { NewsResponse } from "@/types/types.gen";

type DeleteConfirmDialogProps = {
  news: NewsResponse;
};

const previewContent = (content: string): string => {
  if (content.length <= 100) {
    return content;
  }
  return `${content.slice(0, 100)}…`;
};

export const DeleteConfirmDialog = ({ news }: DeleteConfirmDialogProps) => {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteNewsMutation();

  const contentPreview = useMemo(
    () => previewContent(news.content),
    [news.content]
  );

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(news.id);
      setOpen(false);
    } catch (error) {
      // エラー時はダイアログを開いたままにし、再試行を許可する
      console.error("News deletion failed:", {
        newsId: news.id,
        newsDate: news.newsDate,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button
          disabled={deleteMutation.isPending}
          size="sm"
          type="button"
          variant="destructive"
        >
          削除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>このお知らせを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {contentPreview}
            <br />
            この操作は取り消せません。削除すると復元できません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
