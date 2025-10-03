import { api } from "@/shared/api/axiosClient";

import type {
  CreateNewsInput,
  NewsItem,
  NewsListFilters,
  NewsListResponse,
  NewsPoller,
  NewsPollerOptions,
  UpdateNewsInput,
} from "../types";

const DEFAULT_POLL_INTERVAL_MS = 30_000;

const buildListParams = (
  filters?: NewsListFilters
): Record<string, string | number | boolean> | undefined => {
  if (!filters) {
    return;
  }

  const params: Record<string, string | number | boolean> = {};

  if (filters.category?.trim()) {
    params.category = filters.category.trim();
  }

  if (filters.status === "published") {
    params.published = true;
  } else if (filters.status === "draft") {
    params.published = false;
  }

  if (typeof filters.page === "number") {
    params.page = filters.page;
  }

  if (typeof filters.pageSize === "number") {
    params.size = filters.pageSize;
  }

  if (filters.search?.trim()) {
    params.search = filters.search.trim();
  }

  return Object.keys(params).length > 0 ? params : undefined;
};

export const fetchNewsList = (
  filters?: NewsListFilters
): Promise<NewsListResponse> => {
  const params = buildListParams(filters);
  const config = params ? { params } : undefined;
  return api.get<NewsListResponse>("/api/news", config);
};

export const createNews = async (payload: CreateNewsInput): Promise<NewsItem> =>
  api.post<NewsItem>("/api/news", {
    data: payload,
  });

export const updateNews = async (
  id: number,
  payload: UpdateNewsInput
): Promise<NewsItem> =>
  api.put<NewsItem>(`/api/news/${id}`, {
    data: payload,
  });

export const deleteNews = async (id: number): Promise<void> =>
  api.delete<void>(`/api/news/${id}`);

export const setNewsPublicationStatus = async (
  id: number,
  published: boolean
): Promise<void> =>
  api.patch<void>(`/api/news/${id}/status`, {
    data: { published },
  });

const createInterval = (
  callback: () => void,
  intervalMs: number
): ReturnType<typeof setInterval> | undefined => {
  if (intervalMs <= 0) {
    return;
  }
  return setInterval(callback, intervalMs);
};

export const createNewsPoller = ({
  intervalMs = DEFAULT_POLL_INTERVAL_MS,
  filters,
  onUpdate,
  onError,
  immediate = true,
}: NewsPollerOptions): NewsPoller => {
  let timer: ReturnType<typeof setInterval> | undefined;
  let isRunning = false;
  let stopped = false;

  const run = async () => {
    if (isRunning || stopped) {
      return;
    }
    isRunning = true;
    try {
      const response = await fetchNewsList(filters);
      await onUpdate(response);
    } catch (error) {
      onError?.(error);
    } finally {
      isRunning = false;
    }
  };

  if (immediate) {
    run();
  }

  timer = createInterval(() => {
    if (stopped) {
      return;
    }
    run();
  }, intervalMs);

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
    stopped = true;
  };

  return { stop };
};
