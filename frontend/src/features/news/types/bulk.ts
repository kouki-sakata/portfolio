/**
 * バルクAPI用の型定義
 */

/**
 * 個別のお知らせ公開/非公開設定
 */
export type NewsPublishItem = {
  id: number;
  releaseFlag: boolean;
};

/**
 * バルク削除リクエスト
 */
export type NewsBulkDeleteRequest = {
  ids: number[];
};

/**
 * バルク公開/非公開リクエスト
 */
export type NewsBulkPublishRequest = {
  items: NewsPublishItem[];
};

/**
 * 個別操作結果
 */
export type OperationResult = {
  id: number;
  success: boolean;
  errorMessage?: string;
};

/**
 * バルク操作レスポンス
 */
export type NewsBulkOperationResponse = {
  successCount: number;
  failureCount: number;
  results: OperationResult[];
};
