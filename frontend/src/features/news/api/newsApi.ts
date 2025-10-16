import { api } from "@/shared/api/axiosClient";

import type {
  NewsCreateRequest,
  NewsListResponse,
  NewsResponse,
  NewsUpdateRequest,
} from "@/types";

const NEWS_ENDPOINT = "news" as const;

export const fetchNewsList = (): Promise<NewsListResponse> =>
  api.get<NewsListResponse>(NEWS_ENDPOINT, undefined);

export const fetchPublishedNews = (): Promise<NewsListResponse> =>
  api.get<NewsListResponse>(`${NEWS_ENDPOINT}/published`, undefined);

export const createNews = (
  payload: NewsCreateRequest
): Promise<NewsResponse> =>
  api.post<NewsResponse>(NEWS_ENDPOINT, payload, undefined);

export const updateNews = (
  id: number,
  payload: NewsUpdateRequest
): Promise<NewsResponse> =>
  api.put<NewsResponse>(`${NEWS_ENDPOINT}/${id}`, payload, undefined);

export const deleteNews = (id: number): Promise<void> =>
  api.delete<void>(`${NEWS_ENDPOINT}/${id}`, undefined);

export const toggleNewsPublish = (
  id: number,
  releaseFlag: boolean
): Promise<void> =>
  api.patch<void>(`${NEWS_ENDPOINT}/${id}/publish`, { releaseFlag }, undefined);
