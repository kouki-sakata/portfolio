import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import { login } from "@/features/auth/api/login";
import type {
  LoginRequest,
  LoginResponse,
  SessionResponse,
} from "@/features/auth/types";
import {
  queryKeys,
  optimisticUpdate,
  rollbackOptimisticUpdate,
} from "@/shared/utils/queryUtils";

/**
 * ログイン用のカスタムフック
 * 楽観的更新とキャッシュ管理を含む
 */
export const useLogin = (
  options?: Omit<
    UseMutationOptions<LoginResponse, Error, LoginRequest>,
    "mutationFn" | "onMutate" | "onSuccess" | "onError" | "onSettled"
  > & {
    onSuccess?: (data: LoginResponse) => void;
    onError?: (error: Error) => void;
  }
) => {
  const queryClient = useQueryClient();

  const { onSuccess, onError, ...restOptions } = options || {};

  return useMutation<LoginResponse, Error, LoginRequest>({
    ...restOptions,
    mutationFn: login,

    onMutate: async () => {
      // 既存のセッションクエリをキャンセル
      await queryClient.cancelQueries({
        queryKey: queryKeys.auth.session(),
      });

      // 現在のセッションデータをスナップショット
      const previousSession = queryClient.getQueryData<SessionResponse>(
        queryKeys.auth.session()
      );

      // 楽観的更新: ログイン試行中の状態を設定
      optimisticUpdate<SessionResponse>(
        queryClient,
        queryKeys.auth.session(),
        () => ({
          authenticated: false,
          employee: null,
        })
      );

      return { previousSession };
    },

    onError: (error, _variables, context) => {
      // エラー時はロールバック
      if (context?.previousSession !== undefined) {
        rollbackOptimisticUpdate(
          queryClient,
          queryKeys.auth.session(),
          context.previousSession
        );
      }

      // カスタムonErrorコールバックを実行
      onError?.(error);
    },

    onSuccess: (data) => {
      // 成功時はセッションデータを更新
      queryClient.setQueryData<SessionResponse>(queryKeys.auth.session(), {
        authenticated: true,
        employee: data.employee,
      });

      // カスタムonSuccessコールバックを実行
      onSuccess?.(data);
    },

    onSettled: () => {
      // 処理完了後、セッションデータを再検証
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.session(),
      });
    },
  });
};