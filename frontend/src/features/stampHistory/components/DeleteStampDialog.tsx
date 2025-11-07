import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteStamp } from "@/features/stampHistory/api";
import type { StampHistoryEntry } from "@/features/stampHistory/types";
import { toast } from "@/hooks/use-toast";
import { queryKeys } from "@/shared/utils/queryUtils";

type DeleteStampDialogProps = {
  entry: StampHistoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const DeleteStampDialog = ({
  entry,
  open,
  onOpenChange,
}: DeleteStampDialogProps) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteStamp,
    onMutate: async (variables) => {
      // キャンセルして進行中のリフェッチを防ぐ
      await queryClient.cancelQueries({
        queryKey: queryKeys.stampHistory.all,
      });

      // 前の値をスナップショット
      const previousData = queryClient.getQueriesData({
        queryKey: queryKeys.stampHistory.all,
      });

      // 楽観的更新（削除対象エントリを除外）
      queryClient.setQueriesData<{ entries?: StampHistoryEntry[] }>(
        { queryKey: queryKeys.stampHistory.all },
        (old) => {
          if (!old?.entries) {
            return old;
          }
          return {
            ...old,
            entries: old.entries.filter((e) => e.id !== variables.id),
          };
        }
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // エラー時はロールバック
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast({
        title: "エラー",
        description: "打刻の削除に失敗しました",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "打刻を削除しました",
      });
      onOpenChange(false);
      queryClient
        .invalidateQueries({ queryKey: queryKeys.home.dashboard() })
        .catch(() => {
          /* ignore cache invalidation errors */
        });
    },
    onSettled: () => {
      // 成功・失敗に関わらずキャッシュを無効化
      queryClient
        .invalidateQueries({
          queryKey: queryKeys.stampHistory.all,
        })
        .catch(() => {
          /* ignore cache invalidation errors */
        });
    },
  });

  const handleDelete = () => {
    if (entry?.id) {
      mutation.mutate({ id: entry.id });
    }
  };

  if (!entry) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>打刻削除の確認</AlertDialogTitle>
          <AlertDialogDescription>
            {entry.year}/{entry.month}/{entry.day}の打刻を削除します。
            <br />
            この操作は取り消せません。本当に削除しますか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={handleDelete}
          >
            {mutation.isPending ? "削除中..." : "削除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
