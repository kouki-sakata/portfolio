import { useMemo } from "react";
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
import {
  useBulkDeleteMutation,
  useDeleteNewsMutation,
} from "@/features/news/hooks/useNews";
import { logger } from "@/shared/utils/logger";
import type { NewsResponse } from "@/types";

type DeleteConfirmDialogSingleProps = {
  type: "single";
  news: NewsResponse;
  newsIds?: never;
  onConfirm?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DeleteConfirmDialogBulkProps = {
  type: "bulk";
  news?: never;
  newsIds: number[];
  onConfirm?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DeleteConfirmDialogProps =
  | DeleteConfirmDialogSingleProps
  | DeleteConfirmDialogBulkProps;

const previewContent = (content: string): string => {
  if (content.length <= 100) {
    return content;
  }
  return `${content.slice(0, 100)}…`;
};

export const DeleteConfirmDialog = (props: DeleteConfirmDialogProps) => {
  const { type, onConfirm, open, onOpenChange } = props;
  const deleteMutation = useDeleteNewsMutation();
  const bulkDeleteMutation = useBulkDeleteMutation();

  const isPending = deleteMutation.isPending || bulkDeleteMutation.isPending;

  const contentPreview = useMemo(() => {
    if (type === "single" && props.news) {
      return previewContent(props.news.content);
    }
    return null;
  }, [type, props]);

  const performDelete = async () => {
    if (type === "single") {
      if (!props.news) {
        throw new Error("No news item provided for single deletion");
      }
      await deleteMutation.mutateAsync(props.news.id);
      return;
    }

    if (props.newsIds) {
      await bulkDeleteMutation.mutateAsync({ ids: props.newsIds });
    }
  };

  const handleDelete = async () => {
    try {
      await performDelete();
      onOpenChange(false);
      onConfirm?.();
    } catch (error) {
      // エラー時はダイアログを開いたままにし、再試行を許可する
      const correlationId =
        globalThis.crypto?.randomUUID?.() ?? `news-delete-${Date.now()}`;
      const targetIds =
        type === "single"
          ? [props.news?.id].filter((id): id is number => id !== undefined)
          : (props.newsIds ?? []);
      logger.error("News deletion failed", {
        correlationId,
        type,
        targetIds: Array.isArray(targetIds) ? targetIds : [],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const title =
    type === "single"
      ? "このお知らせを削除しますか？"
      : `選択した${props.newsIds?.length ?? 0}件のお知らせを削除しますか？`;

  const description =
    type === "single" ? (
      <>
        {contentPreview}
        <br />
        この操作は取り消せません。削除すると復元できません。
      </>
    ) : (
      <>
        選択した{props.newsIds?.length ?? 0}
        件のお知らせが完全に削除されます。
        <br />
        この操作は取り消せません。削除すると復元できません。
      </>
    );

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      {type === "single" && (
        <AlertDialogTrigger asChild>
          <Button
            disabled={isPending}
            size="sm"
            type="button"
            variant="destructive"
          >
            削除
          </Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleDelete}>
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
