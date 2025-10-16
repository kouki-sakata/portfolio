import { api } from "@/shared/api/axiosClient";

import type {
  NewsCreateRequest,
  NewsListResponse,
  NewsResponse,
  NewsUpdateRequest,
} from "@/types/types.gen";

export const fetchNewsList = (): Promise<NewsListResponse> =>
  api.get<NewsListResponse>("/news");

export const fetchPublishedNewsList = (): Promise<NewsListResponse> =>
  api.get<NewsListResponse>("/news/published");

export const createNews = (payload: NewsCreateRequest): Promise<NewsResponse> =>
  api.post<NewsResponse>("/news", payload);

export const updateNews = (
  id: number,
  payload: NewsUpdateRequest
): Promise<NewsResponse> => api.put<NewsResponse>(`/news/${id}`, payload);

export const deleteNews = (id: number): Promise<void> =>
  api.delete<void>(`/news/${id}`);

export const toggleNewsPublish = (
  id: number,
  releaseFlag: boolean
): Promise<void> => api.patch<void>(`/news/${id}/publish`, { releaseFlag });
