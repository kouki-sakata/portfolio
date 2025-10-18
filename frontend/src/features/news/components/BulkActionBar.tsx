import type { UseMutationResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

import type { BulkMutationResult } from "../hooks/useNews";

type BulkOperationVariables = {
  ids: number[];
};

type BulkActionBarProps = {
  selectedIds: number[];
  onBulkDeleteClick: () => void;
  publishMutation: UseMutationResult<
    BulkMutationResult,
    unknown,
    BulkOperationVariables,
    unknown
  >;
  unpublishMutation: UseMutationResult<
    BulkMutationResult,
    unknown,
    BulkOperationVariables,
    unknown
  >;
  onPublishSuccess?: (result: BulkMutationResult) => void;
  onUnpublishSuccess?: (result: BulkMutationResult) => void;
};

const sendBulkMutation = (
  mutation: BulkActionBarProps["publishMutation"],
  ids: number[],
  onSuccess?: (result: BulkMutationResult) => void
) => {
  if (ids.length === 0 || mutation.isPending) {
    return;
  }

  mutation.mutate(
    { ids },
    onSuccess
      ? {
          onSuccess,
        }
      : undefined
  );
};

export const BulkActionBar = ({
  selectedIds,
  onBulkDeleteClick,
  publishMutation,
  unpublishMutation,
  onPublishSuccess,
  onUnpublishSuccess,
}: BulkActionBarProps) => {
  const selectedCount = selectedIds.length;
  if (selectedCount === 0) {
    return null;
  }

  const commonButtonProps = {
    disabled: publishMutation.isPending || unpublishMutation.isPending,
    size: "sm" as const,
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <span className="text-muted-foreground text-sm">
        選択中: {selectedCount}件
      </span>
      <div className="flex flex-1 flex-col gap-2 sm:flex-none sm:flex-row">
        <Button
          {...commonButtonProps}
          onClick={() =>
            sendBulkMutation(publishMutation, selectedIds, onPublishSuccess)
          }
          type="button"
          variant="secondary"
        >
          一括公開
        </Button>
        <Button
          {...commonButtonProps}
          onClick={() =>
            sendBulkMutation(unpublishMutation, selectedIds, onUnpublishSuccess)
          }
          type="button"
          variant="outline"
        >
          一括非公開
        </Button>
        <Button
          disabled={commonButtonProps.disabled}
          onClick={onBulkDeleteClick}
          size="sm"
          type="button"
          variant="destructive"
        >
          選択した{selectedCount}件を削除
        </Button>
      </div>
    </div>
  );
};
