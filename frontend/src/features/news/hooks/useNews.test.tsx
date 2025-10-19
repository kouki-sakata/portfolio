import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import * as newsApi from "@/features/news/api/newsApi";
import { toast as toastFn } from "@/hooks/use-toast";
import { mswServer } from "@/test/msw/server";
import type {
  NewsCreateRequest,
  NewsListResponse,
  NewsResponse,
  NewsUpdateRequest,
} from "@/types";
import {
  newsQueryKeys,
  useBulkDeleteMutation,
  useBulkPublishMutation,
  useBulkUnpublishMutation,
  useCreateNewsMutation,
  useDeleteNewsMutation,
  useNewsQuery,
  usePublishedNewsQuery,
  useTogglePublishMutation,
  useUpdateNewsMutation,
} from "./useNews";

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

const toast = vi.mocked(toastFn);

const API_BASE_URL = "http://localhost/api";

const createNews = (overrides?: Partial<NewsResponse>): NewsResponse => ({
  id: overrides?.id ?? 1,
  newsDate: overrides?.newsDate ?? "2025-10-01",
  content:
    overrides?.content ?? "本日18時よりシステムメンテナンスを実施します。",
  releaseFlag: overrides?.releaseFlag ?? true,
  updateDate: overrides?.updateDate ?? "2025-10-01T09:00:00Z",
});

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createWrapper = () => {
  const queryClient = createQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper: Wrapper, queryClient };
};

const getListData = (news: NewsResponse[]): NewsListResponse => ({ news });

describe("useNewsQuery", () => {
  beforeEach(() => {
    toast.mockClear();
  });

  it("フェッチに成功した場合にニュース一覧を返す", async () => {
    const response = getListData([
      createNews({ id: 10, releaseFlag: true, newsDate: "2025-10-02" }),
    ]);

    mswServer.use(
      http.get(`${API_BASE_URL}/news`, () =>
        HttpResponse.json(response, { status: 200 })
      )
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNewsQuery(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(response);
    expect(result.current.data?.news).toHaveLength(1);
    expect(result.current.isStale).toBe(false);
  });

  it("公開済みニュースクエリが公開情報のみを取得する", async () => {
    const response = getListData([
      createNews({ id: 20, releaseFlag: true, newsDate: "2025-10-03" }),
    ]);

    mswServer.use(
      http.get(`${API_BASE_URL}/news/published`, () =>
        HttpResponse.json(response, { status: 200 })
      )
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePublishedNewsQuery(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(response);
    expect(result.current.data?.news.every((item) => item.releaseFlag)).toBe(
      true
    );
  });
});

describe("useCreateNewsMutation", () => {
  beforeEach(() => {
    toast.mockClear();
  });

  it("作成成功時にキャッシュを無効化しトーストを表示する", async () => {
    const payload: NewsCreateRequest = {
      newsDate: "2025-10-05",
      content: "新機能リリースのお知らせ",
    };

    const created = createNews({ id: 99, ...payload, releaseFlag: false });

    mswServer.use(
      http.options(`${API_BASE_URL}/news`, () =>
        HttpResponse.json(null, { status: 200 })
      ),
      http.post(`${API_BASE_URL}/news`, async ({ request }) => {
        await request.json();
        return HttpResponse.json(created, { status: 201 });
      })
    );

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateNewsMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: newsQueryKeys.list() })
      );
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: newsQueryKeys.published() })
      );
    });

    expect(toast).toHaveBeenCalledWith({
      title: "お知らせを登録しました",
      description: "登録済みのお知らせは即座に一覧へ反映されます。",
    });
  });
});

describe("useUpdateNewsMutation", () => {
  beforeEach(() => {
    toast.mockClear();
  });

  it("更新成功時に一覧を再取得する", async () => {
    const payload: NewsUpdateRequest = {
      newsDate: "2025-10-06",
      content: "本文を更新しました",
    };

    const updated = createNews({ id: 5, ...payload, releaseFlag: true });

    mswServer.use(
      http.options(`${API_BASE_URL}/news/5`, () =>
        HttpResponse.json(null, { status: 200 })
      ),
      http.put(`${API_BASE_URL}/news/5`, async ({ request }) => {
        await request.json();
        return HttpResponse.json(updated, { status: 200 });
      })
    );

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateNewsMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 5, data: payload });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: newsQueryKeys.list() })
      );
    });

    expect(toast).toHaveBeenCalledWith({
      title: "お知らせを更新しました",
      description: "内容が最新の情報へと保存されました。",
    });
  });
});

describe("useDeleteNewsMutation", () => {
  beforeEach(() => {
    toast.mockClear();
  });

  it("削除失敗時にエラーtoastを表示し、キャッシュをロールバックする", async () => {
    const initialList = getListData([
      createNews({ id: 30, releaseFlag: true }),
      createNews({ id: 31, releaseFlag: false }),
    ]);

    mswServer.use(
      http.options(`${API_BASE_URL}/news/30`, () =>
        HttpResponse.json(null, { status: 200 })
      ),
      http.delete(`${API_BASE_URL}/news/30`, () =>
        HttpResponse.json({ message: "failed" }, { status: 500 })
      )
    );

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(newsQueryKeys.list(), initialList);

    const { result } = renderHook(() => useDeleteNewsMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(30).catch(() => {
        // テスト内で例外を握りつぶす
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<NewsListResponse>(
      newsQueryKeys.list()
    );
    expect(cached).toEqual(initialList);

    expect(toast).toHaveBeenCalledWith({
      title: "お知らせの削除に失敗しました",
      description: "ネットワーク状況をご確認のうえ、再実行してください。",
      variant: "destructive",
    });
  });
});

describe("useTogglePublishMutation", () => {
  beforeEach(() => {
    toast.mockClear();
  });

  it("公開状態切り替え時に楽観的更新を行い、完了後にキャッシュを再検証する", async () => {
    const initialNews = createNews({ id: 40, releaseFlag: false });
    const initialList = getListData([initialNews]);

    const toggleSpy = vi
      .spyOn(newsApi, "toggleNewsPublish")
      .mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(newsQueryKeys.list(), initialList);

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useTogglePublishMutation(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ id: 40, releaseFlag: true });
    });

    await waitFor(() => {
      const optimistic = queryClient.getQueryData<NewsListResponse>(
        newsQueryKeys.list()
      );
      expect(optimistic?.news.at(0)?.releaseFlag).toBe(true);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: newsQueryKeys.list() })
      );
    });

    expect(toggleSpy).toHaveBeenCalledWith(40, true);
    expect(toast).toHaveBeenCalledWith({
      title: "公開状態を更新しました",
      description: "閲覧権限が最新の状態に反映されました。",
    });

    toggleSpy.mockRestore();
  });

  it("公開切り替え失敗時にロールバックしエラーtoastを表示する", async () => {
    const initialNews = createNews({ id: 41, releaseFlag: true });
    const initialList = getListData([initialNews]);

    const toggleSpy = vi
      .spyOn(newsApi, "toggleNewsPublish")
      .mockRejectedValue(new Error("failed"));

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(newsQueryKeys.list(), initialList);

    const { result } = renderHook(() => useTogglePublishMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current
        .mutateAsync({ id: 41, releaseFlag: false })
        .catch(() => {
          // 例外はテスト内で無視
        });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const rolledBack = queryClient.getQueryData<NewsListResponse>(
      newsQueryKeys.list()
    );
    expect(rolledBack).toEqual(initialList);

    expect(toggleSpy).toHaveBeenCalledWith(41, false);
    expect(toast).toHaveBeenCalledWith({
      title: "公開状態の変更に失敗しました",
      description: "再度お試しください。",
      variant: "destructive",
    });

    toggleSpy.mockRestore();
  });
});

describe("useBulkPublishMutation", () => {
  beforeEach(() => {
    toast.mockClear();
  });

  it("すべて成功した場合にバルクAPIを呼び出しトーストを表示する", async () => {
    const bulkPublishSpy = vi
      .spyOn(newsApi, "bulkPublishNews")
      .mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        results: [
          { id: 10, success: true, errorMessage: undefined },
          { id: 20, success: true, errorMessage: undefined },
        ],
      });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useBulkPublishMutation(), {
      wrapper,
    });

    const outcome = await result.current.mutateAsync({ ids: [10, 20] });

    expect(outcome).toEqual({ successIds: [10, 20], failedIds: [] });
    expect(bulkPublishSpy).toHaveBeenCalledWith([
      { id: 10, releaseFlag: true },
      { id: 20, releaseFlag: true },
    ]);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: newsQueryKeys.list() })
      );
    });

    expect(toast).toHaveBeenCalledWith({
      title: "お知らせを一括公開しました",
      description: "2件のお知らせを公開済みに更新しました。",
    });

    bulkPublishSpy.mockRestore();
  });

  it("一部失敗した場合に失敗件数のトーストを表示する", async () => {
    const bulkPublishSpy = vi
      .spyOn(newsApi, "bulkPublishNews")
      .mockResolvedValue({
        successCount: 1,
        failureCount: 1,
        results: [
          { id: 1, success: true, errorMessage: undefined },
          { id: 2, success: false, errorMessage: "Failed to update" },
        ],
      });

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBulkPublishMutation(), {
      wrapper,
    });

    const outcome = await result.current.mutateAsync({ ids: [1, 2] });

    expect(outcome).toEqual({ successIds: [1], failedIds: [2] });
    expect(toast).toHaveBeenCalledWith({
      title: "お知らせを一括公開しました",
      description: "1件のお知らせを公開済みに更新しました。",
    });
    expect(toast).toHaveBeenCalledWith({
      title: "一部のお知らせで公開に失敗しました",
      description: "失敗: 1件",
      variant: "destructive",
    });

    bulkPublishSpy.mockRestore();
  });
});

describe("useBulkUnpublishMutation", () => {
  beforeEach(() => {
    toast.mockClear();
  });

  it("非公開処理をバルクAPIで実行する", async () => {
    const bulkPublishSpy = vi
      .spyOn(newsApi, "bulkPublishNews")
      .mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        results: [{ id: 5, success: true, errorMessage: undefined }],
      });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useBulkUnpublishMutation(), {
      wrapper,
    });

    const outcome = await result.current.mutateAsync({ ids: [5] });

    expect(outcome).toEqual({ successIds: [5], failedIds: [] });
    expect(bulkPublishSpy).toHaveBeenCalledWith([
      { id: 5, releaseFlag: false },
    ]);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: newsQueryKeys.list() })
      );
    });

    expect(toast).toHaveBeenCalledWith({
      title: "お知らせを一括非公開にしました",
      description: "1件のお知らせを下書きに戻しました。",
    });

    bulkPublishSpy.mockRestore();
  });
});

describe("useBulkDeleteMutation", () => {
  beforeEach(() => {
    toast.mockClear();
  });

  it("削除をバルクAPIで実行し失敗件数を通知する", async () => {
    const bulkDeleteSpy = vi
      .spyOn(newsApi, "bulkDeleteNews")
      .mockResolvedValue({
        successCount: 1,
        failureCount: 1,
        results: [
          { id: 99, success: true, errorMessage: undefined },
          { id: 100, success: false, errorMessage: "Delete failed" },
        ],
      });

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBulkDeleteMutation(), {
      wrapper,
    });

    const outcome = await result.current.mutateAsync({ ids: [99, 100] });

    expect(outcome).toEqual({ successIds: [99], failedIds: [100] });
    expect(bulkDeleteSpy).toHaveBeenCalledWith([99, 100]);
    expect(toast).toHaveBeenCalledWith({
      title: "お知らせを一括削除しました",
      description: "1件のお知らせを削除しました。",
    });
    expect(toast).toHaveBeenCalledWith({
      title: "一部のお知らせの削除に失敗しました",
      description: "失敗: 1件",
      variant: "destructive",
    });

    bulkDeleteSpy.mockRestore();
  });
});

describe("ニュース関連フックのキャッシュ設定", () => {
  it("ニュース一覧クエリが設計されたstaleTime/gcTimeを使用する", async () => {
    const response = getListData([createNews({ id: 50 })]);

    mswServer.use(
      http.get(`${API_BASE_URL}/news`, () =>
        HttpResponse.json(response, { status: 200 })
      )
    );

    const { wrapper, queryClient } = createWrapper();

    renderHook(() => useNewsQuery(), { wrapper });

    await waitFor(() => {
      const query = queryClient
        .getQueryCache()
        .find({ queryKey: newsQueryKeys.list() });
      expect(query?.state.status).toBe("success");
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: newsQueryKeys.list() });

    const options = query?.options as
      | {
          staleTime?: number;
          gcTime?: number;
        }
      | undefined;

    expect(options?.staleTime).toBe(QUERY_CONFIG.news.staleTime);
    expect(options?.gcTime).toBe(QUERY_CONFIG.news.gcTime);
  });

  it("公開ニュースクエリがカスタムrefetchIntervalを適用できる", async () => {
    const response = getListData([createNews({ id: 60 })]);

    mswServer.use(
      http.get(`${API_BASE_URL}/news/published`, () =>
        HttpResponse.json(response, { status: 200 })
      )
    );

    const { wrapper, queryClient } = createWrapper();

    renderHook(
      () =>
        usePublishedNewsQuery({
          refetchInterval: 30_000,
        }),
      { wrapper }
    );

    await waitFor(() => {
      const query = queryClient
        .getQueryCache()
        .find({ queryKey: newsQueryKeys.published() });
      expect(query?.state.status).toBe("success");
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: newsQueryKeys.published() });

    const options = query?.options as
      | {
          refetchInterval?: number;
        }
      | undefined;

    expect(options?.refetchInterval).toBe(30_000);
  });
});
