import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createBatchOptimisticMutation,
  createDebouncedOptimisticMutation,
  createListOptimisticMutation,
  createOptimisticMutation,
  createPaginatedOptimisticMutation,
  type OptimisticContext,
} from "@/shared/utils/mutationHelpers";

describe("楽観的更新ヘルパー関数", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  describe("createOptimisticMutation", () => {
    it("型推論が正しく動作する", () => {
      type TData = { id: number; name: string };
      type TError = Error;
      type TVariables = { name: string };
      type TQueryData = TData[];

      const mutationFn = vi
        .fn<[TVariables], Promise<TData>>()
        .mockResolvedValue({ id: 1, name: "test" });

      const options = createOptimisticMutation<
        TData,
        TError,
        TVariables,
        TQueryData
      >(queryClient, {
        mutationFn,
        queryKey: ["test"],
        optimisticUpdater: (oldData, variables) => {
          // TypeScript型推論の確認
          const _typeCheck1: TQueryData | undefined = oldData;
          const _typeCheck2: TVariables = variables;
          return [...(oldData || []), { id: 0, name: variables.name }];
        },
      });

      // 返される型が正しいことを確認
      expect(options.mutationFn).toBe(mutationFn);
      expect(options.onMutate).toBeDefined();
      expect(options.onError).toBeDefined();
      expect(options.onSettled).toBeDefined();
    });

    it("楽観的更新が即座に適用される", async () => {
      const queryKey = ["items"] as const;
      const initialData = [{ id: 1, name: "Item 1" }];
      queryClient.setQueryData(queryKey, initialData);

      const mutationFn = vi.fn().mockResolvedValue({ id: 2, name: "Item 2" });

      const mutation = createOptimisticMutation(queryClient, {
        mutationFn,
        queryKey,
        optimisticUpdater: (oldData, variables) => {
          const typedOldData = oldData as typeof initialData;
          const typedVariables = variables as { name: string };
          return [...typedOldData, { id: 0, name: typedVariables.name }];
        },
      });

      // onMutateを実行
      const context = await mutation.onMutate?.({ name: "Item 2" });

      // 楽観的更新が適用される
      const updatedData = queryClient.getQueryData(queryKey);
      expect(updatedData).toEqual([
        { id: 1, name: "Item 1" },
        { id: 0, name: "Item 2" },
      ]);

      // コンテキストに前のデータが保存される
      expect(context?.previousData).toEqual(initialData);
    });

    it("エラー時にロールバックが正しく動作する", async () => {
      const queryKey = ["rollback"] as const;
      const initialData = { count: 10 };
      queryClient.setQueryData(queryKey, initialData);

      const error = new Error("Mutation failed");
      const mutationFn = vi.fn().mockRejectedValue(error);
      const rollbackHandler = vi.fn();

      const mutation = createOptimisticMutation(queryClient, {
        mutationFn,
        queryKey,
        optimisticUpdater: () => ({ count: 20 }),
        rollbackHandler,
      });

      // 楽観的更新を適用
      const context = await mutation.onMutate?.(undefined);

      // エラーハンドリング
      mutation.onError?.(
        error,
        undefined,
        context as OptimisticContext<typeof initialData>
      );

      // データがロールバックされる
      expect(queryClient.getQueryData(queryKey)).toEqual(initialData);

      // カスタムロールバックハンドラーが呼ばれる
      expect(rollbackHandler).toHaveBeenCalledWith(error, undefined);
    });

    it("成功時にカスタムハンドラーが実行される", () => {
      const onSuccessHandler = vi.fn();
      const data = { id: 1, name: "Success" };
      const variables = { name: "Test" };

      const mutation = createOptimisticMutation(queryClient, {
        mutationFn: vi.fn(),
        queryKey: ["success"],
        optimisticUpdater: () => data,
        onSuccessHandler,
      });

      mutation.onSuccess?.(data, variables, {} as OptimisticContext<unknown>, queryClient);

      expect(onSuccessHandler).toHaveBeenCalledWith(data, variables);
    });

    it("onSettledで関連クエリが無効化される", async () => {
      const queryKey = ["main"] as const;
      const relatedKey1 = ["related", "1"] as const;
      const relatedKey2 = ["related", "2"] as const;

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const mutation = createOptimisticMutation(queryClient, {
        mutationFn: vi.fn(),
        queryKey,
        optimisticUpdater: (old) => old,
        invalidateQueries: [relatedKey1 as unknown[], relatedKey2 as unknown[]],
      });

      await mutation.onSettled?.(
        undefined,
        undefined,
        undefined,
        {} as OptimisticContext<unknown>,
        queryClient
      );

      // メインクエリと関連クエリが無効化される
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: relatedKey1 });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: relatedKey2 });
    });
  });

  describe("createListOptimisticMutation", () => {
    type Item = { id: number | string; name: string };

    it("create操作でアイテムが追加される", async () => {
      const listQueryKey = ["items"] as const;
      const initialList: Item[] = [{ id: 1, name: "Item 1" }];
      queryClient.setQueryData(listQueryKey, initialList);

      const mutation = createListOptimisticMutation<Item>(queryClient, {
        mutationFn: vi.fn(),
        listQueryKey,
        operation: "create",
        getItem: () => ({ id: 2, name: "Item 2" }),
      });

      await mutation.onMutate?.(undefined as unknown);

      const updatedList = queryClient.getQueryData<Item[]>(listQueryKey);
      expect(updatedList).toHaveLength(2);
      expect(updatedList?.[1]).toEqual({ id: 2, name: "Item 2" });
    });

    it("update操作でアイテムが更新される", async () => {
      const listQueryKey = ["items"] as const;
      const initialList: Item[] = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ];
      queryClient.setQueryData(listQueryKey, initialList);

      const mutation = createListOptimisticMutation<Item>(queryClient, {
        mutationFn: vi.fn(),
        listQueryKey,
        operation: "update",
        getItem: () => ({ id: 1, name: "Updated Item 1" }),
      });

      await mutation.onMutate?.(undefined as unknown);

      const updatedList = queryClient.getQueryData<Item[]>(listQueryKey);
      expect(updatedList?.[0]?.name).toBe("Updated Item 1");
      expect(updatedList?.[1]?.name).toBe("Item 2");
    });

    it("delete操作でアイテムが削除される", async () => {
      const listQueryKey = ["items"] as const;
      const initialList: Item[] = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ];
      queryClient.setQueryData(listQueryKey, initialList);

      const mutation = createListOptimisticMutation<Item>(queryClient, {
        mutationFn: vi.fn(),
        listQueryKey,
        operation: "delete",
        getItem: () => ({ id: 1, name: "" }),
      });

      await mutation.onMutate?.(undefined as unknown);

      const updatedList = queryClient.getQueryData<Item[]>(listQueryKey);
      expect(updatedList).toHaveLength(1);
      expect(updatedList?.[0]?.id).toBe(2);
    });

    it("個別のアイテムキャッシュも更新される", async () => {
      const listQueryKey = ["items"] as const;
      const itemQueryKey = (id: number | string) => ["item", id] as const;
      const newItem = { id: 1, name: "New Item" };

      const mutation = createListOptimisticMutation<Item>(queryClient, {
        mutationFn: vi.fn(),
        listQueryKey,
        itemQueryKey,
        operation: "create",
        getItem: () => newItem,
      });

      await mutation.onMutate?.(undefined as unknown);

      // 個別のアイテムキャッシュが設定される
      expect(queryClient.getQueryData(itemQueryKey(1))).toEqual(newItem);
    });

    it("エラー時にリストがロールバックされる", async () => {
      const listQueryKey = ["items"] as const;
      const initialList: Item[] = [{ id: 1, name: "Item 1" }];
      queryClient.setQueryData(listQueryKey, initialList);

      const mutation = createListOptimisticMutation<Item>(queryClient, {
        mutationFn: vi.fn(),
        listQueryKey,
        operation: "create",
        getItem: () => ({ id: 2, name: "Item 2" }),
      });

      const context = await mutation.onMutate?.(undefined as unknown);

      // エラー時のロールバック
      mutation.onError?.(new Error("Test error"), undefined as unknown, context ?? {}, queryClient);

      expect(queryClient.getQueryData(listQueryKey)).toEqual(initialList);
    });
  });

  describe("createPaginatedOptimisticMutation", () => {
    type Item = { id: number; name: string };
    type PageData = { items: Item[]; total: number };

    it("ページネーションデータが正しく更新される", async () => {
      const pageQueryKey = (page: number) => ["page", page] as const;
      const pageData: PageData = {
        items: [{ id: 1, name: "Item 1" }],
        total: 1,
      };
      queryClient.setQueryData(pageQueryKey(1), pageData);

      const mutation = createPaginatedOptimisticMutation<Item>(queryClient, {
        mutationFn: vi.fn(),
        pageQueryKey,
        operation: "create",
        getItem: () => ({ id: 2, name: "Item 2" }),
        currentPage: 1,
      });

      await mutation.onMutate?.({ page: 1 } as { page?: number });

      const updatedPage = queryClient.getQueryData<PageData>(pageQueryKey(1));
      expect(updatedPage?.items).toHaveLength(2);
      expect(updatedPage?.total).toBe(2);
    });

    it("削除操作でtotalが減少する", async () => {
      const pageQueryKey = (page: number) => ["page", page] as const;
      const pageData: PageData = {
        items: [
          { id: 1, name: "Item 1" },
          { id: 2, name: "Item 2" },
        ],
        total: 2,
      };
      queryClient.setQueryData(pageQueryKey(1), pageData);

      const mutation = createPaginatedOptimisticMutation<Item>(queryClient, {
        mutationFn: vi.fn(),
        pageQueryKey,
        operation: "delete",
        getItem: () => ({ id: 1, name: "" }),
        currentPage: 1,
      });

      await mutation.onMutate?.({ page: 1 } as { page?: number });

      const updatedPage = queryClient.getQueryData<PageData>(pageQueryKey(1));
      expect(updatedPage?.items).toHaveLength(1);
      expect(updatedPage?.total).toBe(1);
    });
  });

  describe("createBatchOptimisticMutation", () => {
    it("複数のクエリが同時に更新される", async () => {
      const key1 = ["batch", "1"] as const;
      const key2 = ["batch", "2"] as const;

      queryClient.setQueryData(key1, { value: 1 });
      queryClient.setQueryData(key2, { value: 2 });

      const mutation = createBatchOptimisticMutation(queryClient, {
        mutationFn: vi.fn(),
        updates: [
          {
            queryKey: key1,
            updater: () => ({ value: 10 }),
          },
          {
            queryKey: key2,
            updater: () => ({ value: 20 }),
          },
        ],
      });

      await mutation.onMutate?.(undefined as unknown);

      expect(queryClient.getQueryData(key1)).toEqual({ value: 10 });
      expect(queryClient.getQueryData(key2)).toEqual({ value: 20 });
    });

    it("エラー時にすべての更新がロールバックされる", async () => {
      const key1 = ["rollback", "1"] as const;
      const key2 = ["rollback", "2"] as const;
      const initial1 = { value: 1 };
      const initial2 = { value: 2 };

      queryClient.setQueryData(key1, initial1);
      queryClient.setQueryData(key2, initial2);

      const mutation = createBatchOptimisticMutation(queryClient, {
        mutationFn: vi.fn(),
        updates: [
          { queryKey: key1, updater: () => ({ value: 10 }) },
          { queryKey: key2, updater: () => ({ value: 20 }) },
        ],
      });

      const context = await mutation.onMutate?.(undefined as unknown);

      // ロールバック
      mutation.onError?.(new Error("Rollback test error"), undefined as unknown, context ?? {}, queryClient);

      expect(queryClient.getQueryData(key1)).toEqual(initial1);
      expect(queryClient.getQueryData(key2)).toEqual(initial2);
    });
  });

  describe("createDebouncedOptimisticMutation", () => {
    it("mutationがデバウンスされる", async () => {
      const mutationFn = vi.fn().mockResolvedValue({ success: true });

      const mutation = createDebouncedOptimisticMutation(queryClient, {
        mutationFn,
        queryKey: ["debounced"],
        optimisticUpdater: (old) => old,
        debounceMs: 10, // 短い時間に変更
      });

      // 複数回呼び出し
      mutation.mutationFn?.({ test: 1 } as unknown);
      mutation.mutationFn?.({ test: 2 } as unknown);
      const promise = mutation.mutationFn?.({ test: 3 } as unknown);

      // 実際のタイムアウトを待つ
      await new Promise((resolve) => setTimeout(resolve, 20));

      // 最後の呼び出しのみ完了する
      const result = await promise;
      expect(result).toEqual({ success: true });

      // デバウンスされて1回だけ実行される
      expect(mutationFn).toHaveBeenCalledTimes(1);
      expect(mutationFn).toHaveBeenCalledWith({ test: 3 });
    });

    it("新しい呼び出しが前の呼び出しをキャンセルする", async () => {
      const mutationFn = vi
        .fn()
        .mockImplementation((variables) => Promise.resolve(variables));

      const mutation = createDebouncedOptimisticMutation(queryClient, {
        mutationFn,
        queryKey: ["debounced"],
        optimisticUpdater: (old) => old,
        debounceMs: 10,
      });

      // 連続して呼び出し
      mutation.mutationFn?.({ value: 1 } as unknown);
      // すぐに2回目（最初のはキャンセルされる）
      const finalPromise = mutation.mutationFn?.({ value: 2 } as unknown);

      // 実際のタイムアウトを待つ
      await new Promise((resolve) => setTimeout(resolve, 20));

      const result = await finalPromise;

      // 最後の呼び出しのみ実行される
      expect(mutationFn).toHaveBeenCalledTimes(1);
      expect(mutationFn).toHaveBeenCalledWith({ value: 2 });
      expect(result).toEqual({ value: 2 });
    });
  });
});
