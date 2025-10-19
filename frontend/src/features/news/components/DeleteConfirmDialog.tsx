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
import {
  type BulkMutationResult,
  useBulkDeleteMutation,
  useDeleteNewsMutation,
} from "@/features/news/hooks/useNews";
import { logger } from "@/shared/utils/logger";
import type { NewsResponse } from "@/types";

type DeleteConfirmDialogSingleProps = {
  type?: "single";
  news: NewsResponse;
  newsIds?: never;
  onConfirm?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type DeleteConfirmDialogBulkProps = {
  type: "bulk";
  news?: never;
  newsIds: number[];
  onConfirm?: (result?: BulkMutationResult) => void;
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
  const isBulk = props.type === "bulk";
  const dialogType: "single" | "bulk" = isBulk ? "bulk" : "single";

  const deleteMutation = useDeleteNewsMutation();
  const bulkDeleteMutation = useBulkDeleteMutation();

  const [internalOpen, setInternalOpen] = useState(false);
  const controlledOpen =
    "open" in props && typeof props.open === "boolean" ? props.open : undefined;
  const actualOpen = controlledOpen ?? internalOpen;

  const handleDialogOpenChange = (next: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }

    if ("onOpenChange" in props && props.onOpenChange) {
      props.onOpenChange(next);
    }
  };

  let newsItem: NewsResponse | undefined;
  let newsIds: number[] = [];

  if (isBulk) {
    newsIds = props.newsIds;
  } else {
    newsItem = props.news;
  }

  const isPending = isBulk
    ? deleteMutation.isPending || bulkDeleteMutation.isPending
    : deleteMutation.isPending;

  const titlePreview = useMemo(() => {
    if (!newsItem) {
      return null;
    }
    return previewContent(newsItem.content);
  }, [newsItem]);

  const performDelete = async () => {
    if (!isBulk) {
      if (!newsItem) {
        throw new Error("No news item provided for single deletion");
      }
      await deleteMutation.mutateAsync(newsItem.id);
      return;
    }

    if (newsIds.length > 0) {
      return bulkDeleteMutation.mutateAsync({ ids: newsIds });
    }
  };

  const handleDelete = async () => {
    try {
      const result = await performDelete();
      handleDialogOpenChange(false);
      if (isBulk) {
        props.onConfirm?.(result as BulkMutationResult | undefined);
      } else {
        props.onConfirm?.();
      }
    } catch (error) {
      // エラー時はダイアログを開いたままにし、再試行を許可する
      const correlationId =
        globalThis.crypto?.randomUUID?.() ?? `news-delete-${Date.now()}`;
      const targetIds =
        dialogType === "single"
          ? [newsItem?.id].filter((id): id is number => id !== undefined)
          : newsIds;
      logger.error("News deletion failed", {
        correlationId,
        type: dialogType,
        targetIds: Array.isArray(targetIds) ? targetIds : [],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const title =
    dialogType === "single"
      ? "このお知らせを削除しますか？"
      : `選択した${newsIds.length}件のお知らせを削除しますか？`;

  const description =
    dialogType === "single" ? (
      <>
        {titlePreview ? (
          <span className="mb-2 block rounded-md bg-muted px-3 py-2 font-semibold text-foreground text-sm">
            {titlePreview}
          </span>
        ) : null}
        <span className="block">
          この操作は取り消せません。削除すると復元できません。
        </span>
      </>
    ) : (
      <>
        選択した{newsIds.length}件のお知らせが完全に削除されます。
        <br />
        この操作は取り消せません。削除すると復元できません。
      </>
    );

  return (
    <AlertDialog onOpenChange={handleDialogOpenChange} open={actualOpen}>
      {dialogType === "single" && controlledOpen === undefined && (
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
