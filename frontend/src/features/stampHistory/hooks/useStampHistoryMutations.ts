import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteStamp, updateStamp } from "@/features/stampHistory/api";
import type {
  DeleteStampRequest,
  StampHistoryEntry,
  UpdateStampRequest,
} from "@/features/stampHistory/types";
import { toast } from "@/hooks/use-toast";
import { createOptimisticMutation } from "@/shared/utils/mutationHelpers";
import { queryKeys } from "@/shared/utils/queryUtils";

/**
 * 打刻更新用mutationフック
 *
 * @remarks
 * - 楽観的更新により即座にUIに反映
 * - エラー時は自動的にロールバック
 * - 型安全性を完全に保証
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateStampMutation();
 * await updateMutation.mutateAsync({
 *   id: 123,
 *   inTime: "09:00",
 *   outTime: "18:00"
 * });
 * ```
 */
export function useUpdateStampMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    createOptimisticMutation<
      void,
      Error,
      UpdateStampRequest,
      { entries?: StampHistoryEntry[] }
    >(queryClient, {
      mutationFn: async (request) => {
        await updateStamp(request);
      },
      queryKey: ["stamp-history"],
      optimisticUpdater: (oldData, variables) => {
        if (!oldData?.entries) {
          return oldData;
        }

        return {
          ...oldData,
          entries: oldData.entries.map((entry) =>
            entry.id === variables.id
              ? {
                  ...entry,
                  inTime: variables.inTime ?? null,
                  outTime: variables.outTime ?? null,
                }
              : entry
          ),
        };
      },
      onSuccessHandler: () => {
        toast({
          title: "成功",
          description: "打刻を更新しました",
        });
      },
      rollbackHandler: () => {
        toast({
          title: "エラー",
          description: "打刻の更新に失敗しました",
          variant: "destructive",
        });
      },
      invalidateQueries: [
        queryKeys.stampHistory.all,
        queryKeys.home.dashboard(),
      ],
    })
  );
}

/**
 * 打刻削除用mutationフック
 *
 * @remarks
 * - 楽観的更新により即座にUIから削除
 * - エラー時は自動的にロールバック
 * - 関連するキャッシュも適切に無効化
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteStampMutation();
 * await deleteMutation.mutateAsync({ id: 123 });
 * ```
 */
export function useDeleteStampMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    createOptimisticMutation<
      void,
      Error,
      DeleteStampRequest,
      { entries?: StampHistoryEntry[] }
    >(queryClient, {
      mutationFn: async (request) => {
        await deleteStamp(request);
      },
      queryKey: ["stamp-history"],
      optimisticUpdater: (oldData, variables) => {
        if (!oldData?.entries) {
          return oldData;
        }

        return {
          ...oldData,
          entries: oldData.entries.filter((entry) => entry.id !== variables.id),
        };
      },
      onSuccessHandler: () => {
        toast({
          title: "成功",
          description: "打刻を削除しました",
        });
      },
      rollbackHandler: () => {
        toast({
          title: "エラー",
          description: "打刻の削除に失敗しました",
          variant: "destructive",
        });
      },
      invalidateQueries: [
        queryKeys.stampHistory.all,
        queryKeys.home.dashboard(),
      ],
    })
  );
}

/**
 * 一括削除用mutationフック（将来の拡張用）
 *
 * @remarks
 * - 複数の打刻を一度に削除
 * - 楽観的更新で即座に複数アイテムを削除
 * - エラー時は全てロールバック
 */
export function useDeleteMultipleStampsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stampIds: number[]) => {
      // 並列実行で高速化
      await Promise.all(stampIds.map((id) => deleteStamp({ id })));
      return stampIds;
    },
    onMutate: async (stampIds) => {
      // 進行中のクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: ["stamp-history"] });

      // 現在のキャッシュを保存（ロールバック用）
      const previousData = queryClient.getQueryData<{
        entries?: StampHistoryEntry[];
      }>(["stamp-history"]);

      // 楽観的にキャッシュを更新（削除対象を除外）
      if (previousData?.entries) {
        queryClient.setQueryData<{ entries: StampHistoryEntry[] }>(
          ["stamp-history"],
          {
            entries: previousData.entries.filter(
              (entry) => !stampIds.includes(entry.id ?? 0)
            ),
          }
        );
      }

      // ロールバック用のコンテキストを返す
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // エラー時はキャッシュをロールバック
      if (context?.previousData) {
        queryClient.setQueryData(["stamp-history"], context.previousData);
      }
      toast({
        title: "エラー",
        description: "打刻の一括削除に失敗しました",
        variant: "destructive",
      });
    },
    onSuccess: (deletedIds) => {
      toast({
        title: "成功",
        description: `${deletedIds.length}件の打刻を削除しました`,
      });
    },
    onSettled: async () => {
      // 最新データを再フェッチ
      await queryClient.invalidateQueries({ queryKey: ["stamp-history"] });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.home.dashboard(),
      });
    },
  });
}
