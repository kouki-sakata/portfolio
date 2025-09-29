import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { logout } from "@/features/auth/api/logout";
import type { SessionResponse } from "@/features/auth/types";
import { clearAllCaches, queryKeys } from "@/shared/utils/queryUtils";

/**
 * ログアウト用のカスタムフック
 * すべてのキャッシュをクリアし、セッションを無効化
 */
export const useLogout = (
  options?: Omit<
    UseMutationOptions<void, Error, void>,
    "mutationFn" | "onMutate" | "onSuccess" | "onError" | "onSettled"
  > & {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    onSettled?: () => void;
  }
) => {
  const queryClient = useQueryClient();

  const { onSuccess, onError, onSettled, ...restOptions } = options || {};

  return useMutation<void, Error, void>({
    ...restOptions,
    mutationFn: logout,

    onMutate: async () => {
      // ログアウト処理中、セッションクエリをキャンセル
      await queryClient.cancelQueries({
        queryKey: queryKeys.auth.session(),
      });
    },

    onSuccess: () => {
      // カスタムonSuccessコールバックを実行
      onSuccess?.();
    },

    onError: (error) => {
      // エラーが発生してもキャッシュはクリアする（セキュリティのため）
      clearAllCaches(queryClient);

      // セッションデータを明示的に無効化
      queryClient.setQueryData<SessionResponse>(queryKeys.auth.session(), {
        authenticated: false,
        employee: null,
      });

      // カスタムonErrorコールバックを実行
      onError?.(error);
    },

    onSettled: () => {
      // 成功・失敗に関わらず、すべてのキャッシュをクリア
      clearAllCaches(queryClient);

      // セッションデータを明示的に無効化
      queryClient.setQueryData<SessionResponse>(queryKeys.auth.session(), {
        authenticated: false,
        employee: null,
      });

      // カスタムonSettledコールバックを実行
      onSettled?.();
    },
  });
};
