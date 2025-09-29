import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { logout } from "@/features/auth/api/logout";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { queryKeys } from "@/shared/utils/queryUtils";

// APIモジュールをモック
vi.mock("@/features/auth/api/logout");

describe("useLogout", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("正常にログアウトできる", async () => {
    vi.mocked(logout).mockResolvedValue(undefined);

    // 事前にセッションデータを設定
    queryClient.setQueryData(queryKeys.auth.session(), {
      authenticated: true,
      employee: {
        id: 1,
        firstName: "太郎",
        lastName: "山田",
        email: "test@example.com",
        admin: false,
      },
    });

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(logout).toHaveBeenCalled();

    // セッションキャッシュがクリアされているか確認
    const sessionData = queryClient.getQueryData(queryKeys.auth.session());
    expect(sessionData).toEqual({
      authenticated: false,
      employee: null,
    });
  });

  it("すべてのキャッシュをクリアする", async () => {
    vi.mocked(logout).mockResolvedValue(undefined);

    // 複数のキャッシュを設定
    queryClient.setQueryData(queryKeys.auth.session(), {
      authenticated: true,
      employee: { id: 1, email: "test@example.com" },
    });
    queryClient.setQueryData(queryKeys.employees.list(), [
      { id: 1, name: "Employee 1" },
    ]);
    queryClient.setQueryData(queryKeys.stampHistory.list(), [
      { id: 1, timestamp: "2024-01-01" },
    ]);

    const clearSpy = vi.spyOn(queryClient, "clear");

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // すべてのキャッシュがクリアされたか確認
    expect(clearSpy).toHaveBeenCalled();
  });

  it("ログアウトエラー時でもキャッシュをクリアする", async () => {
    const error = new Error("ネットワークエラー");
    vi.mocked(logout).mockRejectedValue(error);

    // セッションデータを設定
    queryClient.setQueryData(queryKeys.auth.session(), {
      authenticated: true,
      employee: {
        id: 1,
        email: "test@example.com",
      },
    });

    const clearSpy = vi.spyOn(queryClient, "clear");

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // エラーが発生してもキャッシュはクリアされる
    expect(clearSpy).toHaveBeenCalled();

    // エラー時でもセッションデータは明示的に無効化される
    const sessionData = queryClient.getQueryData(queryKeys.auth.session());
    expect(sessionData).toEqual({
      authenticated: false,
      employee: null,
    });

    expect(result.current.error).toEqual(error);
  });

  it("ログアウト中の状態が正しく管理される", async () => {
    vi.mocked(logout).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(), 100))
    );

    const { result } = renderHook(() => useLogout(), { wrapper });

    expect(result.current.isPending).toBe(false);

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    }, { timeout: 200 });
  });

  it("mutateAsyncで非同期処理できる", async () => {
    vi.mocked(logout).mockResolvedValue(undefined);

    const { result } = renderHook(() => useLogout(), { wrapper });

    await result.current.mutateAsync();

    expect(logout).toHaveBeenCalled();
  });

  it("onSuccessコールバックが実行される", async () => {
    vi.mocked(logout).mockResolvedValue(undefined);

    const onSuccessSpy = vi.fn();

    const { result } = renderHook(() => useLogout({ onSuccess: onSuccessSpy }), {
      wrapper,
    });

    result.current.mutate();

    await waitFor(() => {
      expect(onSuccessSpy).toHaveBeenCalled();
    });
  });

  it("onErrorコールバックが実行される", async () => {
    const error = new Error("ログアウトエラー");
    vi.mocked(logout).mockRejectedValue(error);

    const onErrorSpy = vi.fn();

    const { result } = renderHook(() => useLogout({ onError: onErrorSpy }), {
      wrapper,
    });

    result.current.mutate();

    await waitFor(() => {
      expect(onErrorSpy).toHaveBeenCalled();
    });

    // onErrorSpyの最初の引数がエラーオブジェクトであることを確認
    expect(onErrorSpy.mock.calls[0][0]).toEqual(error);
  });

  it("onSettledでキャッシュが常にクリアされる", async () => {
    vi.mocked(logout).mockResolvedValue(undefined);

    const onSettledSpy = vi.fn();

    // 事前にいくつかのキャッシュを設定
    queryClient.setQueryData(queryKeys.auth.session(), {
      authenticated: true,
      employee: {
        id: 1,
        email: "test@example.com",
        firstName: "太郎",
        lastName: "山田",
        admin: false,
      },
    });
    queryClient.setQueryData(queryKeys.employees.list(), [
      { id: 1, name: "Employee 1" },
    ]);

    const { result } = renderHook(
      () => useLogout({ onSettled: onSettledSpy }),
      { wrapper }
    );

    result.current.mutate();

    await waitFor(() => {
      expect(onSettledSpy).toHaveBeenCalled();
    });

    // useLogout内部のonSettledが実行されるまで少し待つ
    await waitFor(() => {
      const sessionData = queryClient.getQueryData(queryKeys.auth.session());
      // onSettled後、セッションデータは明示的に無効化される
      expect(sessionData).toEqual({
        authenticated: false,
        employee: null,
      });
    });

    // 他のキャッシュはクリアされている
    const employeeData = queryClient.getQueryData(queryKeys.employees.list());
    expect(employeeData).toBeUndefined();
  });
});