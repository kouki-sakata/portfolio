import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { login } from "@/features/auth/api/login";
import { useLogin } from "@/features/auth/hooks/useLogin";
import type { LoginRequest, LoginResponse } from "@/features/auth/types";
import { queryKeys } from "@/shared/utils/queryUtils";

// APIモジュールをモック
vi.mock("@/features/auth/api/login");

describe("useLogin", () => {
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

  it("正常にログインできる", async () => {
    const mockResponse: LoginResponse = {
      employee: {
        id: 1,
        firstName: "太郎",
        lastName: "山田",
        email: "test@example.com",
        admin: false,
      },
    };

    vi.mocked(login).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useLogin(), { wrapper });

    const loginData: LoginRequest = {
      email: "test@example.com",
      password: "password123",
    };

    result.current.mutate(loginData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(login).toHaveBeenCalledTimes(1);
    expect(vi.mocked(login).mock.calls[0][0]).toEqual(loginData);

    // セッションキャッシュが更新されているか確認
    const sessionData = queryClient.getQueryData(queryKeys.auth.session());
    expect(sessionData).toEqual({
      authenticated: true,
      employee: mockResponse.employee,
    });
  });

  it("楽観的更新が正しく動作する", async () => {
    const mockResponse: LoginResponse = {
      employee: {
        id: 1,
        firstName: "太郎",
        lastName: "山田",
        email: "test@example.com",
        admin: false,
      },
    };

    // 初期状態を設定
    queryClient.setQueryData(queryKeys.auth.session(), {
      authenticated: false,
      employee: null,
    });

    vi.mocked(login).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useLogin(), { wrapper });

    const loginData: LoginRequest = {
      email: "test@example.com",
      password: "password123",
    };

    // ログイン実行
    result.current.mutate(loginData);

    // mutate直後は楽観的更新が反映されている
    const optimisticData = queryClient.getQueryData(queryKeys.auth.session());
    expect(optimisticData).toEqual({
      authenticated: false,
      employee: null,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // 成功後、実際のデータで更新される
    const finalData = queryClient.getQueryData(queryKeys.auth.session());
    expect(finalData).toEqual({
      authenticated: true,
      employee: mockResponse.employee,
    });
  });

  it("エラー時にロールバックする", async () => {
    const error = new Error("ログインに失敗しました");
    vi.mocked(login).mockRejectedValue(error);

    // 事前に既存のセッションデータを設定
    const previousSession = {
      authenticated: false,
      employee: null,
    };
    queryClient.setQueryData(queryKeys.auth.session(), previousSession);

    const { result } = renderHook(() => useLogin(), { wrapper });

    const loginData: LoginRequest = {
      email: "test@example.com",
      password: "wrongpassword",
    };

    result.current.mutate(loginData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // エラー時はロールバックされる
    const sessionData = queryClient.getQueryData(queryKeys.auth.session());
    expect(sessionData).toEqual(previousSession);
    expect(result.current.error).toEqual(error);
  });

  it("ログイン中の状態が正しく管理される", async () => {
    vi.mocked(login).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        employee: {
          id: 1,
          firstName: "太郎",
          lastName: "山田",
          email: "test@example.com",
          admin: false,
        },
      }), 100))
    );

    const { result } = renderHook(() => useLogin(), { wrapper });

    expect(result.current.isPending).toBe(false);

    result.current.mutate({
      email: "test@example.com",
      password: "password123",
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    }, { timeout: 200 });
  });

  it("mutateAsyncで非同期処理できる", async () => {
    const mockResponse: LoginResponse = {
      employee: {
        id: 1,
        firstName: "太郎",
        lastName: "山田",
        email: "test@example.com",
        admin: false,
      },
    };

    vi.mocked(login).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useLogin(), { wrapper });

    const loginData: LoginRequest = {
      email: "test@example.com",
      password: "password123",
    };

    const response = await result.current.mutateAsync(loginData);

    expect(response).toEqual(mockResponse);
    expect(login).toHaveBeenCalledTimes(1);
    expect(vi.mocked(login).mock.calls[0][0]).toEqual(loginData);
  });

  it("onSuccessコールバックが実行される", async () => {
    const mockResponse: LoginResponse = {
      employee: {
        id: 1,
        firstName: "太郎",
        lastName: "山田",
        email: "test@example.com",
        admin: false,
      },
    };

    vi.mocked(login).mockResolvedValue(mockResponse);

    const onSuccessSpy = vi.fn();

    const { result } = renderHook(() => useLogin({ onSuccess: onSuccessSpy }), {
      wrapper,
    });

    result.current.mutate({
      email: "test@example.com",
      password: "password123",
    });

    await waitFor(() => {
      expect(onSuccessSpy).toHaveBeenCalled();
    });

    // onSuccessSpyの最初の引数がレスポンスオブジェクトであることを確認
    expect(onSuccessSpy.mock.calls[0][0]).toEqual(mockResponse);
  });

  it("onErrorコールバックが実行される", async () => {
    const error = new Error("ログインに失敗しました");
    vi.mocked(login).mockRejectedValue(error);

    const onErrorSpy = vi.fn();

    const { result } = renderHook(() => useLogin({ onError: onErrorSpy }), {
      wrapper,
    });

    result.current.mutate({
      email: "test@example.com",
      password: "wrongpassword",
    });

    await waitFor(() => {
      expect(onErrorSpy).toHaveBeenCalled();
    });

    // onErrorSpyの最初の引数がエラーオブジェクトであることを確認
    expect(onErrorSpy.mock.calls[0][0]).toEqual(error);
  });
});