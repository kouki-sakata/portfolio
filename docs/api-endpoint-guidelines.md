# API Endpoint Guidelines

## 問題: 二重 `/api` プレフィックス

### 根本原因

`axiosClient`は`baseURL="/api"`を設定しているため、全てのリクエストは自動的に`/api`プレフィックスが付与されます。

```typescript
// frontend/src/shared/lib/env.ts
export const getEnv = () => ({
  apiBaseUrl: parsedEnv.VITE_API_BASE_URL ?? "/api", // デフォルトで "/api"
});

// frontend/src/shared/api/axiosClient.ts
const defaultConfig: CreateAxiosDefaults = {
  baseURL: apiBaseUrl, // "/api"
  // ...
};
```

### 誤った実装例

```typescript
// ❌ 間違い: /api プレフィックスを含む
export const fetchNewsList = (): Promise<NewsListResponse> =>
  api.get<NewsListResponse>("/api/news");
// 実際のリクエスト: GET /api/api/news → 404

export const createNews = (payload: NewsCreateRequest): Promise<NewsResponse> =>
  api.post<NewsResponse>("/api/news", payload);
// 実際のリクエスト: POST /api/api/news → 404
```

### 正しい実装例

```typescript
// ✅ 正しい: 相対パス (baseURLに追加される)
export const fetchNewsList = (): Promise<NewsListResponse> =>
  api.get<NewsListResponse>("/news");
// 実際のリクエスト: GET /api/news → 200

export const createNews = (payload: NewsCreateRequest): Promise<NewsResponse> =>
  api.post<NewsResponse>("/news", payload);
// 実際のリクエスト: POST /api/news → 200
```

## ベストプラクティス

### 1. API Path Utilsの使用

プロジェクトには`api-path-utils.ts`が用意されており、エンドポイント構築を安全に行えます:

```typescript
import { createApiPath, validateApiPath } from "@/shared/api/api-path-utils";

// ✅ 安全な動的パス生成
const newsDetailPath = createApiPath("/news", newsId); // "/news/123"
const publishPath = createApiPath("/news", newsId, "publish"); // "/news/123/publish"

// ✅ 開発時の検証
const validatedPath = validateApiPath("/news"); // "/news" (OK)
const invalidPath = validateApiPath("/api/news"); // throws error in DEV
```

### 2. エンドポイントパターン

#### 基本的なCRUD操作

```typescript
// 一覧取得
api.get<ListResponse>("/resources");

// 詳細取得
api.get<DetailResponse>(`/resources/${id}`);

// 作成
api.post<CreateResponse>("/resources", payload);

// 更新
api.put<UpdateResponse>(`/resources/${id}`, payload);

// 部分更新
api.patch<PatchResponse>(`/resources/${id}`, partialPayload);

// 削除
api.delete<void>(`/resources/${id}`);
```

#### サブリソース操作

```typescript
// サブリソース一覧
api.get<SubResourceList>(`/resources/${id}/sub-resources`);

// サブリソース操作
api.patch<ActionResponse>(`/resources/${id}/actions/publish`, actionData);
```

### 3. 型安全性の確保

```typescript
// ✅ OpenAPI生成型を使用
import type {
  NewsListResponse,
  NewsCreateRequest,
  NewsResponse,
} from "@/types/types.gen";

// ✅ 明示的な戻り値の型指定
export const fetchNewsList = (): Promise<NewsListResponse> =>
  api.get<NewsListResponse>("/news");

export const createNews = (
  payload: NewsCreateRequest
): Promise<NewsResponse> => api.post<NewsResponse>("/news", payload);
```

### 4. エラーハンドリング

```typescript
import { ApiError } from "@/shared/api/errors/ApiError";

try {
  const news = await fetchNewsList();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error: ${error.status} - ${error.message}`);
  }
  throw error;
}
```

## テスト

### ユニットテスト例

```typescript
import { describe, expect, it, vi } from "vitest";
import { fetchNewsList } from "./newsApi";

vi.mock("@/shared/api/axiosClient", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("newsApi", () => {
  it("正しいエンドポイントで一覧を取得する", async () => {
    const mockedApi = vi.mocked(api);
    mockedApi.get.mockResolvedValue({ news: [] });

    await fetchNewsList();

    // ✅ /api プレフィックスなし
    expect(mockedApi.get).toHaveBeenCalledWith("/news");
  });
});
```

## チェックリスト

新しいAPI関数を実装する際は、以下を確認してください:

- [ ] エンドポイントパスに `/api` プレフィックスが**含まれていない**
- [ ] OpenAPI生成型を使用している
- [ ] 明示的な戻り値の型が指定されている
- [ ] 動的パス構築には `createApiPath` を使用している
- [ ] ユニットテストで正しいエンドポイントが呼ばれることを確認している
- [ ] エラーハンドリングが適切に実装されている

## 参考リソース

- `frontend/src/shared/api/axiosClient.ts` - APIクライアント実装
- `frontend/src/shared/api/api-path-utils.ts` - パスユーティリティ
- `frontend/src/features/news/api/newsApi.ts` - 実装例
- `frontend/src/features/employees/api/index.ts` - 別の実装例
