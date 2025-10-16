import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import {
  createNews,
  deleteNews,
  fetchNewsList,
  fetchPublishedNews,
  toggleNewsPublish,
  updateNews,
} from "@/features/news/api/newsApi";
import { toast } from "@/hooks/use-toast";
import { queryKeys } from "@/shared/utils/queryUtils";
import type {
  NewsCreateRequest,
  NewsListResponse,
  NewsResponse,
  NewsUpdateRequest,
} from "@/types";

export const newsQueryKeys = {
  all: queryKeys.news.all,
  list: () => queryKeys.news.list(),
  published: () => queryKeys.news.published(),
  detail: (id: number) => queryKeys.news.detail(id),
} as const;

export const useNewsQuery = () =>
  useQuery<NewsListResponse>({
    queryKey: newsQueryKeys.list(),
    queryFn: fetchNewsList,
    staleTime: QUERY_CONFIG.news.staleTime,
    gcTime: QUERY_CONFIG.news.gcTime,
  });

export const usePublishedNewsQuery = () =>
  useQuery<NewsListResponse>({
    queryKey: newsQueryKeys.published(),
    queryFn: fetchPublishedNews,
    staleTime: QUERY_CONFIG.news.staleTime,
    gcTime: QUERY_CONFIG.news.gcTime,
  });

export const useCreateNewsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<NewsResponse, unknown, NewsCreateRequest>({
    mutationFn: (payload: NewsCreateRequest) => createNews(payload),
    onSuccess: async () => {
      toast({
        title: "お知らせを登録しました",
        description: "登録済みのお知らせは即座に一覧へ反映されます。",
      });

      await queryClient.invalidateQueries({
        queryKey: newsQueryKeys.list(),
      });
      await queryClient.invalidateQueries({
        queryKey: newsQueryKeys.published(),
      });
    },
    onError: () => {
      toast({
        title: "お知らせの登録に失敗しました",
        description: "時間を空けて再度お試しください。",
        variant: "destructive",
      });
    },
  });
};

type UpdateNewsVariables = {
  id: number;
  data: NewsUpdateRequest;
};

export const useUpdateNewsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<NewsResponse, unknown, UpdateNewsVariables>({
    mutationFn: ({ id, data }: UpdateNewsVariables) => updateNews(id, data),
    onSuccess: async () => {
      toast({
        title: "お知らせを更新しました",
        description: "内容が最新の情報へと保存されました。",
      });

      await queryClient.invalidateQueries({
        queryKey: newsQueryKeys.list(),
      });
      await queryClient.invalidateQueries({
        queryKey: newsQueryKeys.published(),
      });
    },
    onError: () => {
      toast({
        title: "お知らせの更新に失敗しました",
        description: "入力内容を確認し、再度お試しください。",
        variant: "destructive",
      });
    },
  });
};

type DeleteNewsContext = {
  previousList?: NewsListResponse;
};

export const useDeleteNewsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, number, DeleteNewsContext>({
    mutationFn: (id: number) => deleteNews(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: newsQueryKeys.list() });

      const previousList = queryClient.getQueryData<NewsListResponse>(
        newsQueryKeys.list()
      );

      if (previousList) {
        const nextList: NewsListResponse = {
          news: previousList.news.filter((item) => item.id !== id),
        };
        queryClient.setQueryData(newsQueryKeys.list(), nextList);
      }

      return { previousList } satisfies DeleteNewsContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(newsQueryKeys.list(), context.previousList);
      }

      toast({
        title: "お知らせの削除に失敗しました",
        description: "ネットワーク状況をご確認のうえ、再実行してください。",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      toast({
        title: "お知らせを削除しました",
        description: "一覧から対象のお知らせを除外しました。",
      });

      await queryClient.invalidateQueries({
        queryKey: newsQueryKeys.list(),
      });
      await queryClient.invalidateQueries({
        queryKey: newsQueryKeys.published(),
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: newsQueryKeys.list(),
      });
      await queryClient.invalidateQueries({
        queryKey: newsQueryKeys.published(),
      });
    },
  });
};

type TogglePublishVariables = {
  id: number;
  releaseFlag: boolean;
};

type TogglePublishContext = {
  previousList?: NewsListResponse;
  previousPublished?: NewsListResponse;
};

export const useTogglePublishMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    unknown,
    TogglePublishVariables,
    TogglePublishContext
  >({
    mutationFn: ({ id, releaseFlag }) => toggleNewsPublish(id, releaseFlag),
    onMutate: async ({ id, releaseFlag }) => {
      await queryClient.cancelQueries({ queryKey: newsQueryKeys.list() });
      await queryClient.cancelQueries({ queryKey: newsQueryKeys.published() });

      const previousList = queryClient.getQueryData<NewsListResponse>(
        newsQueryKeys.list()
      );
      const previousPublished = queryClient.getQueryData<NewsListResponse>(
        newsQueryKeys.published()
      );

      let nextList: NewsListResponse | undefined;
      if (previousList) {
        nextList = {
          news: previousList.news.map((item) =>
            item.id === id ? { ...item, releaseFlag } : item
          ),
        };
        queryClient.setQueryData(newsQueryKeys.list(), nextList);
      }

      if (previousPublished) {
        const sourceList = nextList ?? previousList;
        const updatedItem = sourceList?.news.find((item) => item.id === id);

        let nextPublishedNews: NewsResponse[] = previousPublished.news;
        if (releaseFlag) {
          const withoutTarget = previousPublished.news.filter(
            (item) => item.id !== id
          );
          nextPublishedNews = updatedItem
            ? [...withoutTarget, updatedItem]
            : withoutTarget;
        } else {
          nextPublishedNews = previousPublished.news.filter(
            (item) => item.id !== id
          );
        }

        queryClient.setQueryData(newsQueryKeys.published(), {
          news: nextPublishedNews,
        });
      }

      return { previousList, previousPublished } satisfies TogglePublishContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(newsQueryKeys.list(), context.previousList);
      }
      if (context?.previousPublished) {
        queryClient.setQueryData(
          newsQueryKeys.published(),
          context.previousPublished
        );
      }

      toast({
        title: "公開状態の変更に失敗しました",
        description: "再度お試しください。",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "公開状態を更新しました",
        description: "閲覧権限が最新の状態に反映されました。",
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: newsQueryKeys.list(),
      });
      await queryClient.invalidateQueries({
        queryKey: newsQueryKeys.published(),
      });
    },
  });
};
