import { api } from "@/shared/api/axiosClient";

import type {
  NewsCreateRequest,
  NewsListResponse,
  NewsResponse,
  NewsUpdateRequest,
} from "@/types/types.gen";

export const fetchNewsList = (): Promise<NewsListResponse> =>
  api.get<NewsListResponse>("/api/news");

export const fetchPublishedNewsList = (): Promise<NewsListResponse> =>
  api.get<NewsListResponse>("/api/news/published");

export const createNews = (payload: NewsCreateRequest): Promise<NewsResponse> =>
  api.post<NewsResponse>("/api/news", payload);

export const updateNews = (
  id: number,
  payload: NewsUpdateRequest
): Promise<NewsResponse> => api.put<NewsResponse>(`/api/news/${id}`, payload);

export const deleteNews = (id: number): Promise<void> =>
  api.delete<void>(`/api/news/${id}`);

export const toggleNewsPublish = (
  id: number,
  releaseFlag: boolean
): Promise<NewsResponse> =>
  api.patch<NewsResponse>(`/api/news/${id}/publish`, { releaseFlag });
