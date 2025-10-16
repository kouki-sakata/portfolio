import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import type {
  NewsCreateRequest,
  NewsResponse,
  NewsUpdateRequest,
} from "@/types/types.gen";
import {
  createNews,
  deleteNews,
  fetchNewsList,
  toggleNewsPublish,
  updateNews,
} from "../api/newsApi";

const NEWS_QUERY_KEY = ["news"] as const;

/**
 * Safely extracts error message from unknown error
 * @param error - The caught error
 * @param fallback - Fallback message if extraction fails
 * @returns Human-readable error message
 */
const toErrorMessage = (
  error: unknown,
  fallback = "操作に失敗しました"
): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return fallback;
};

export const useNewsQuery = (): UseQueryResult<NewsResponse[]> =>
  useQuery({
    queryKey: NEWS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetchNewsList();
      return response.news;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCreateNewsMutation = (): UseMutationResult<
  NewsResponse,
  unknown,
  NewsCreateRequest
> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<NewsResponse, unknown, NewsCreateRequest>({
    mutationFn: createNews,
    onSuccess: () => {
      toast({ title: "お知らせを作成しました" });
      void queryClient.invalidateQueries({ queryKey: NEWS_QUERY_KEY });
    },
    onError: (error) => {
      toast({
        title: "お知らせの作成に失敗しました",
        description: toErrorMessage(error),
        variant: "destructive",
      });
    },
  });
};

export const useUpdateNewsMutation = (): UseMutationResult<
  NewsResponse,
  unknown,
  { id: number } & NewsUpdateRequest
> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<NewsResponse, unknown, { id: number } & NewsUpdateRequest>(
    {
      mutationFn: ({ id, ...payload }) => updateNews(id, payload),
      onSuccess: () => {
        toast({ title: "お知らせを更新しました" });
        void queryClient.invalidateQueries({ queryKey: NEWS_QUERY_KEY });
      },
      onError: (error) => {
        toast({
          title: "お知らせの更新に失敗しました",
          description: toErrorMessage(error),
          variant: "destructive",
        });
      },
    }
  );
};

export const useDeleteNewsMutation = (): UseMutationResult<
  void,
  unknown,
  number
> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, unknown, number>({
    mutationFn: deleteNews,
    onSuccess: () => {
      toast({ title: "お知らせを削除しました" });
      void queryClient.invalidateQueries({ queryKey: NEWS_QUERY_KEY });
    },
    onError: (error) => {
      toast({
        title: "お知らせの削除に失敗しました",
        description: toErrorMessage(error),
        variant: "destructive",
      });
    },
  });
};

export const useTogglePublishMutation = (): UseMutationResult<
  void,
  unknown,
  { id: number; releaseFlag: boolean }
> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    void,
    unknown,
    { id: number; releaseFlag: boolean },
    { previousNews?: NewsResponse[] }
  >({
    mutationFn: ({ id, releaseFlag }) => toggleNewsPublish(id, releaseFlag),
    onMutate: async ({ id, releaseFlag }) => {
      await queryClient.cancelQueries({ queryKey: NEWS_QUERY_KEY });
      const previous = queryClient.getQueryData<NewsResponse[]>(NEWS_QUERY_KEY);

      queryClient.setQueryData<NewsResponse[]>(NEWS_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }
        return current.map((item) =>
          item.id === id ? { ...item, releaseFlag } : item
        );
      });

      return { previousNews: previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previousNews) {
        queryClient.setQueryData(NEWS_QUERY_KEY, context.previousNews);
      }
      toast({
        title: "公開状態の切り替えに失敗しました",
        description: toErrorMessage(error),
        variant: "destructive",
      });
    },
    onSuccess: (_data, variables) => {
      toast({
        title: variables.releaseFlag ? "公開しました" : "下書きに変更しました",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NEWS_QUERY_KEY });
    },
  });
};

export { NEWS_QUERY_KEY };
