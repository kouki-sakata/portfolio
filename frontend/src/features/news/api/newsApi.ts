import { api } from "@/shared/api/axiosClient";

import type {
  NewsCreateRequest,
  NewsListResponse,
  NewsResponse,
  NewsUpdateRequest,
} from "@/types";

import type {
  NewsBulkDeleteRequest,
  NewsBulkOperationResponse,
  NewsBulkPublishRequest,
  NewsPublishItem,
} from "../types/bulk";

const NEWS_ENDPOINT = "/news" as const;

export const fetchNewsList = async (): Promise<NewsListResponse> => {
  const response = await api.get<NewsListResponse>(NEWS_ENDPOINT, undefined);
  // デバッグ用ログ（開発環境でのみ表示）
  if (import.meta.env.DEV) {
    console.log("News API Response:", response);
    if (response?.news?.length > 0) {
      console.log("First news item:", response.news[0]);
    }
  }
  return response;
};

export const fetchPublishedNews = (): Promise<NewsListResponse> =>
  api.get<NewsListResponse>(`${NEWS_ENDPOINT}/published`, undefined);

export const createNews = (payload: NewsCreateRequest): Promise<NewsResponse> =>
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

/**
 * 複数のお知らせを一括削除
 * @param ids 削除対象のお知らせIDリスト（最大100件）
 * @returns バルク操作結果
 */
export const bulkDeleteNews = (
  ids: number[]
): Promise<NewsBulkOperationResponse> => {
  const request: NewsBulkDeleteRequest = { ids };
  return api.post<NewsBulkOperationResponse>(
    `${NEWS_ENDPOINT}/bulk/delete`,
    request,
    undefined
  );
};

/**
 * 複数のお知らせの公開/非公開を一括変更
 * @param items 更新対象のお知らせと公開フラグのリスト（最大100件）
 * @returns バルク操作結果
 */
export const bulkPublishNews = (
  items: NewsPublishItem[]
): Promise<NewsBulkOperationResponse> => {
  const request: NewsBulkPublishRequest = { items };
  return api.patch<NewsBulkOperationResponse>(
    `${NEWS_ENDPOINT}/bulk/publish`,
    request,
    undefined
  );
};
