import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import {
  createHomeRepository,
  type IHomeRepository,
} from "@/features/home/repositories/HomeRepository";
import { toast } from "@/hooks/use-toast";
import { formatLocalTimestamp } from "@/shared/utils/date";
import { queryKeys } from "@/shared/utils/queryUtils";

const DEFAULT_SUCCESS_MESSAGE = "休憩ステータスを更新しました";
const DEFAULT_ERROR_MESSAGE = "休憩の切り替えに失敗しました";
const CONFLICT_ERROR_MESSAGE =
  "休憩操作は既に登録されています。画面を再読み込みして最新の勤怠状況を確認してください。";

export type UseBreakToggleOptions = {
  timestampProvider?: () => string;
};

export const useBreakToggle = (
  repository: IHomeRepository = createHomeRepository(),
  options: UseBreakToggleOptions = {}
) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string | undefined>({
    mutationFn: async (timestamp) => {
      const resolvedTimestamp = (() => {
        if (timestamp) {
          return timestamp;
        }
        if (options.timestampProvider) {
          try {
            const provided = options.timestampProvider();
            if (provided) {
              return provided;
            }
          } catch {
            /* fall through */
          }
        }
        return formatLocalTimestamp();
      })();

      await repository.toggleBreak(resolvedTimestamp);
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: DEFAULT_SUCCESS_MESSAGE,
      });
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.home.dashboard() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stampHistory.all }),
      ]).catch(() => {
        /* ignore cache invalidation errors */
      });
    },
    onError: (error) => {
      const status =
        typeof error === "object" && error
          ? (error as { status?: number }).status
          : undefined;
      const description =
        status === 409
          ? CONFLICT_ERROR_MESSAGE
          : error.message || DEFAULT_ERROR_MESSAGE;
      toast({
        variant: "destructive",
        title: "エラー",
        description,
      });
    },
  });

  const toggleBreak = useCallback(
    async (timestamp?: string) => mutation.mutateAsync(timestamp),
    [mutation]
  );

  return {
    toggleBreak,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};
