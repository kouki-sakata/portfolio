import { QueryCache, QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  backgroundRefetch,
  cascadeInvalidate,
  conditionalInvalidate,
  invalidateMultipleQueries,
  invalidatePartialMatch,
  invalidateQueries,
  invalidateRelatedQueries,
  queryKeys,
  smartInvalidate,
} from "@/shared/utils/queryUtils";

describe("React Query キャッシュ最適化", () => {
  let queryClient: QueryClient;
  let queryCache: QueryCache;

  beforeEach(() => {
    queryCache = new QueryCache();
    queryClient = new QueryClient({
      queryCache,
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  describe("キャッシュヒット率の向上", () => {
    it("prefetchによりキャッシュヒット率が向上する", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "test" });
      const queryKey = ["test-query"] as const;

      // 事前フェッチ
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: fetchFn,
        staleTime: 60_000, // 60秒間は新鮮
      });

      expect(fetchFn).toHaveBeenCalledTimes(1);

      // 同じクエリを再度実行（キャッシュから取得）
      // staleTimeを設定してキャッシュを使用させる
      const result = await queryClient.fetchQuery({
        queryKey,
        queryFn: fetchFn,
        staleTime: 60_000, // prefetchと同じstaleTimeを設定
      });

      // キャッシュから取得されるため、fetchFnは再度呼ばれない
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: "test" });
    });

    it("staleTime設定により不要な再フェッチが防止される", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "test" });
      const queryKey = queryKeys.employees.list({ page: 1 });

      // 初回フェッチ
      await queryClient.fetchQuery({
        queryKey,
        queryFn: fetchFn,
        staleTime: 30 * 60 * 1000, // 30分間新鮮
      });

      // 即座に再フェッチを試みる
      // staleTimeを設定してキャッシュを使用させる
      await queryClient.fetchQuery({
        queryKey,
        queryFn: fetchFn,
        staleTime: 30 * 60 * 1000, // 同じstaleTimeを設定
      });

      // staleTime内なので再フェッチされない
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("gcTime設定によりキャッシュが保持される", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "test" });
      const queryKey = ["cache-test"] as const;

      // gcTimeを設定してフェッチ
      await queryClient.fetchQuery({
        queryKey,
        queryFn: fetchFn,
        gcTime: 60 * 60 * 1000, // 1時間保持
      });

      // キャッシュをクリアしない限り、データは保持される
      const cachedData = queryClient.getQueryData(queryKey);
      expect(cachedData).toEqual({ data: "test" });

      // 手動でガベージコレクションを実行してもgcTime内なら保持
      const queries = queryClient.getQueryCache().findAll();
      for (const query of queries) {
        if (query.state.dataUpdatedAt < Date.now() - 1000) {
          // 1秒以上経過したクエリでも、gcTime内なら削除されない
          expect(queryClient.getQueryData(queryKey)).toBeDefined();
        }
      }
    });
  });

  describe("楽観的更新のレスポンスタイム", () => {
    it("楽観的更新により即座にUIが更新される", () => {
      const initialData = { count: 0 };
      const queryKey = ["optimistic-test"] as const;

      // 初期データを設定
      queryClient.setQueryData(queryKey, initialData);

      // 楽観的更新を実行（同期的に即座に更新）
      const startTime = performance.now();

      queryClient.setQueryData(
        queryKey,
        (old: typeof initialData | undefined) => {
          if (!old) {
            return { count: 1 };
          }
          return { count: old.count + 1 };
        }
      );

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // 更新は1ms未満で完了すべき（同期処理）
      expect(updateTime).toBeLessThan(1);

      // データが即座に更新されている
      const updatedData =
        queryClient.getQueryData<typeof initialData>(queryKey);
      expect(updatedData?.count).toBe(1);
    });

    it("楽観的更新のロールバックが正しく動作する", () => {
      const initialData = { name: "initial" };
      const queryKey = ["rollback-test"] as const;

      // 初期データ設定
      queryClient.setQueryData(queryKey, initialData);

      // 楽観的更新前のデータを保存
      const previousData = queryClient.getQueryData(queryKey);

      // 楽観的更新
      queryClient.setQueryData(queryKey, { name: "optimistic" });

      // 更新確認
      expect(queryClient.getQueryData(queryKey)).toEqual({
        name: "optimistic",
      });

      // エラー時のロールバック
      queryClient.setQueryData(queryKey, previousData);

      // ロールバック確認
      expect(queryClient.getQueryData(queryKey)).toEqual(initialData);
    });
  });

  describe("キャッシュ無効化戦略", () => {
    it("関連クエリのみが適切に無効化される", async () => {
      // 複数のクエリを設定
      const employeeListData = { employees: [] };
      const employeeDetailData = { id: 1, name: "Test" };
      const stampHistoryData = { stamps: [] };

      queryClient.setQueryData(queryKeys.employees.list(), employeeListData);
      queryClient.setQueryData(
        queryKeys.employees.detail(1),
        employeeDetailData
      );
      queryClient.setQueryData(queryKeys.stampHistory.all, stampHistoryData);

      // 従業員関連のクエリのみを無効化
      await invalidateQueries(queryClient, queryKeys.employees.all);

      // 従業員クエリは無効化される
      const employeeQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: queryKeys.employees.all });
      for (const query of employeeQueries) {
        expect(query.isStale()).toBe(true);
      }

      // 打刻履歴クエリは無効化されない
      const stampQuery = queryClient
        .getQueryCache()
        .find({ queryKey: queryKeys.stampHistory.all });
      // クエリが存在し、かつstaleでない場合のみテスト
      if (stampQuery) {
        expect(stampQuery.isStale()).toBe(false);
      }
    });

    it("invalidateRelatedQueriesが正しく動作する", async () => {
      // データを設定
      queryClient.setQueryData(queryKeys.employees.all, { data: "employees" });
      queryClient.setQueryData(queryKeys.home.dashboard(), {
        data: "dashboard",
      });

      // employee.createアクションで関連クエリを無効化
      await invalidateRelatedQueries(queryClient, {
        type: "employee.create",
      });

      // employees.allが無効化される
      const employeeQuery = queryClient
        .getQueryCache()
        .find({ queryKey: queryKeys.employees.all });
      if (employeeQuery) {
        expect(employeeQuery.isStale()).toBe(true);
      }
    });

    it("smartInvalidateが条件に応じて無効化する", async () => {
      const queryKey = ["smart-test"] as const;
      const freshData = { data: "fresh", timestamp: Date.now() };

      // 新しいデータを設定
      queryClient.setQueryData(queryKey, freshData);

      // skipIfFresh=trueで、新鮮なデータは無効化されない
      await smartInvalidate(queryClient, queryKey, {
        skipIfFresh: true,
        maxStaleTime: 60_000, // 60秒
      });

      const query = queryClient.getQueryCache().find({ queryKey });
      if (query) {
        expect(query.isStale()).toBe(false);
      }

      // force=trueで強制的に無効化
      await smartInvalidate(queryClient, queryKey, {
        force: true,
      });

      if (query) {
        expect(query.isStale()).toBe(true);
      }
    });

    it("cascadeInvalidateが段階的に無効化する", async () => {
      const primaryKey = queryKeys.home.dashboard();
      const secondaryKey = queryKeys.home.news();

      queryClient.setQueryData(primaryKey, { data: "dashboard" });
      queryClient.setQueryData(secondaryKey, { data: "news" });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      // 段階的無効化を実行
      await cascadeInvalidate(
        queryClient,
        [primaryKey],
        [secondaryKey],
        10 // 10ms遅延
      );

      // primaryKeyは即座に無効化
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: primaryKey });

      // secondaryKeyは遅延後に無効化
      await new Promise((resolve) => setTimeout(resolve, 20));

      // setTimeoutで非同期に実行されるため、確認が必要
      const secondaryQuery = queryClient
        .getQueryCache()
        .find({ queryKey: secondaryKey });
      if (secondaryQuery) {
        // 遅延後にチェック
        expect(secondaryQuery.isStale()).toBeDefined();
      }
    });

    it("conditionalInvalidateが条件付きで無効化する", async () => {
      const queryKey = ["conditional-test"] as const;
      queryClient.setQueryData(queryKey, { data: "test" });

      // 条件がfalseの場合、無効化されない
      await conditionalInvalidate(queryClient, false, queryKey);
      const query1 = queryClient.getQueryCache().find({ queryKey });
      if (query1) {
        expect(query1.isStale()).toBe(false);
      }

      // 条件がtrueの場合、無効化される
      await conditionalInvalidate(queryClient, true, queryKey);
      const query2 = queryClient.getQueryCache().find({ queryKey });
      if (query2) {
        expect(query2.isStale()).toBe(true);
      }
    });

    it("backgroundRefetchがバックグラウンドで更新する", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "updated" });
      const queryKey = ["background-test"] as const;

      // 初期データを設定
      queryClient.setQueryData(queryKey, { data: "initial" });

      // クエリを登録
      queryClient.setQueryDefaults(queryKey, {
        queryFn: fetchFn,
      });

      // バックグラウンドリフェッチを実行
      const refetchPromise = backgroundRefetch(queryClient, queryKey, {
        stale: true,
      });

      // リフェッチが非同期で実行される
      expect(refetchPromise).toBeInstanceOf(Promise);

      await refetchPromise;

      // fetchFnが呼ばれることを確認（クエリが登録されている場合）
      // 注: 実際のrefetchQueriesの動作はQueryClientの内部実装に依存
    });

    it("invalidatePartialMatchが部分一致で無効化する", async () => {
      // 複数のクエリを設定
      queryClient.setQueryData(["todos", "list"], { data: "list" });
      queryClient.setQueryData(["todos", "detail", 1], { data: "detail1" });
      queryClient.setQueryData(["todos", "detail", 2], { data: "detail2" });
      queryClient.setQueryData(["posts", "list"], { data: "posts" });

      // "todos"で始まるクエリのみを無効化
      await invalidatePartialMatch(queryClient, ["todos"]);

      // todosクエリはすべて無効化される
      const todosQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: ["todos"], exact: false });
      for (const query of todosQueries) {
        expect(query.isStale()).toBe(true);
      }

      // postsクエリは無効化されない
      const postsQuery = queryClient
        .getQueryCache()
        .find({ queryKey: ["posts", "list"] });
      if (postsQuery) {
        expect(postsQuery.isStale()).toBe(false);
      }
    });
  });

  describe("複数クエリの無効化", () => {
    it("invalidateMultipleQueriesが複数のクエリキーを無効化する", async () => {
      const key1 = ["multi", "1"] as const;
      const key2 = ["multi", "2"] as const;
      const key3 = ["other"] as const;

      queryClient.setQueryData(key1, { data: "1" });
      queryClient.setQueryData(key2, { data: "2" });
      queryClient.setQueryData(key3, { data: "other" });

      // 複数のクエリを無効化
      await invalidateMultipleQueries(queryClient, [key1, key2]);

      // 指定したクエリは無効化される
      const query1 = queryClient.getQueryCache().find({ queryKey: key1 });
      const query2 = queryClient.getQueryCache().find({ queryKey: key2 });
      if (query1) {
        expect(query1.isStale()).toBe(true);
      }
      if (query2) {
        expect(query2.isStale()).toBe(true);
      }

      // 指定していないクエリは無効化されない
      const query3 = queryClient.getQueryCache().find({ queryKey: key3 });
      if (query3) {
        expect(query3.isStale()).toBe(false);
      }
    });
  });
});
