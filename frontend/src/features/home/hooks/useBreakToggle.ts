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
      toast({
        variant: "destructive",
        title: "エラー",
        description: error.message || DEFAULT_ERROR_MESSAGE,
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
