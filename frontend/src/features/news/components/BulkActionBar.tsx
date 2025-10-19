import { Button } from "@/components/ui/button";
import type { BulkMutationResult } from "@/features/news/hooks/useNews";

type BulkMutationHandler = {
  isPending: boolean;
  mutateAsync: (variables: { ids: number[] }) => Promise<BulkMutationResult>;
};

type BulkActionBarProps = {
  selectedIds: number[];
  publishMutation: BulkMutationHandler;
  unpublishMutation: BulkMutationHandler;
  onPublishSuccess?: (result: BulkMutationResult) => void;
  onUnpublishSuccess?: (result: BulkMutationResult) => void;
  onBulkDeleteClick: () => void;
};

export const BulkActionBar = ({
  selectedIds,
  publishMutation,
  unpublishMutation,
  onPublishSuccess,
  onUnpublishSuccess,
  onBulkDeleteClick,
}: BulkActionBarProps) => {
  const selectedCount = selectedIds.length;
  const hasSelection = selectedCount > 0;
  const isPublishing = publishMutation.isPending;
  const isUnpublishing = unpublishMutation.isPending;

  const handleBulkPublish = async () => {
    if (!hasSelection || isPublishing) {
      return;
    }

    try {
      const result = await publishMutation.mutateAsync({ ids: selectedIds });
      onPublishSuccess?.(result);
    } catch (_error) {
      // エラー時のトーストはミューテーション側で処理済み
    }
  };

  const handleBulkUnpublish = async () => {
    if (!hasSelection || isUnpublishing) {
      return;
    }

    try {
      const result = await unpublishMutation.mutateAsync({ ids: selectedIds });
      onUnpublishSuccess?.(result);
    } catch (_error) {
      // エラー時のトーストはミューテーション側で処理済み
    }
  };

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <output aria-live="polite" className="font-medium text-sm">
        選択中: {selectedCount}件
      </output>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={!hasSelection || isPublishing}
          onClick={handleBulkPublish}
          size="sm"
          type="button"
        >
          一括公開
        </Button>
        <Button
          disabled={!hasSelection || isUnpublishing}
          onClick={handleBulkUnpublish}
          size="sm"
          type="button"
          variant="secondary"
        >
          一括非公開
        </Button>
        <Button
          disabled={!hasSelection || isPublishing || isUnpublishing}
          onClick={onBulkDeleteClick}
          size="sm"
          type="button"
          variant="destructive"
        >
          一括削除
        </Button>
      </div>
    </div>
  );
};
