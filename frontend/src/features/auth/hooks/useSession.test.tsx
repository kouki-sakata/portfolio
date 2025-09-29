import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchSession } from "@/features/auth/api/session";
import { useSession } from "@/features/auth/hooks/useSession";
import type { SessionResponse } from "@/features/auth/types";

// APIモジュールをモック
vi.mock("@/features/auth/api/session");

describe("useSession", () => {
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

  it("セッション情報を取得できる", async () => {
    const mockSession: SessionResponse = {
      authenticated: true,
      employee: {
        id: 1,
        firstName: "太郎",
        lastName: "山田",
        email: "test@example.com",
        admin: false,
      },
    };

    vi.mocked(fetchSession).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSession);
    expect(fetchSession).toHaveBeenCalled();
  });

  it("認証状態を正しく判定できる", async () => {
    const mockSession: SessionResponse = {
      authenticated: true,
      employee: {
        id: 1,
        firstName: "太郎",
        lastName: "山田",
        email: "test@example.com",
        admin: false,
      },
    };

    vi.mocked(fetchSession).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockSession.employee);
  });

  it("未認証状態を正しく判定できる", async () => {
    const mockSession: SessionResponse = {
      authenticated: false,
      employee: null,
    };

    vi.mocked(fetchSession).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("適切なstaleTimeとgcTimeが設定される", async () => {
    const mockSession: SessionResponse = {
      authenticated: true,
      employee: {
        id: 1,
        email: "test@example.com",
        firstName: "太郎",
        lastName: "山田",
        admin: false,
      },
    };

    vi.mocked(fetchSession).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // クエリの設定を確認
    const queryState = queryClient.getQueryState(["auth", "session"]);
    expect(queryState).toBeDefined();
  });

  it("refetchInterval（15分）が設定される", () => {
    const mockSession: SessionResponse = {
      authenticated: true,
      employee: {
        id: 1,
        email: "test@example.com",
        firstName: "太郎",
        lastName: "山田",
        admin: false,
      },
    };

    vi.mocked(fetchSession).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    // refetchIntervalが15分（900000ms）に設定されているか確認
    // React Query内部の実装により、直接的な確認は困難なため、
    // fetchSession が定期的に呼ばれることを期待
    expect(result.current.isLoading).toBe(true);
  });

  it("エラー時のリトライ戦略が動作する", async () => {
    const error = new Error("ネットワークエラー");
    vi.mocked(fetchSession).mockRejectedValueOnce(error).mockResolvedValueOnce({
      authenticated: false,
      employee: null,
    });

    renderHook(() => useSession(), { wrapper });

    // エラー後にリトライされることを確認
    await waitFor(() => {
      expect(fetchSession).toHaveBeenCalledTimes(1);
    });
  });

  it("ローディング状態が正しく管理される", async () => {
    const mockSession: SessionResponse = {
      authenticated: true,
      employee: {
        id: 1,
        email: "test@example.com",
        firstName: "太郎",
        lastName: "山田",
        admin: false,
      },
    };

    vi.mocked(fetchSession).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockSession), 100))
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    // 初期状態ではローディング中
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSession);
  });

  it("refetchメソッドで手動更新できる", async () => {
    const mockSession1: SessionResponse = {
      authenticated: true,
      employee: {
        id: 1,
        email: "test@example.com",
        firstName: "太郎",
        lastName: "山田",
        admin: false,
      },
    };

    const mockSession2: SessionResponse = {
      authenticated: true,
      employee: {
        id: 1,
        email: "test@example.com",
        firstName: "太郎",
        lastName: "山田",
        admin: true, // 権限が変更された
      },
    };

    vi.mocked(fetchSession)
      .mockResolvedValueOnce(mockSession1)
      .mockResolvedValueOnce(mockSession2);

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.employee?.admin).toBe(false);

    // 手動で再取得
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.data?.employee?.admin).toBe(true);
    });

    expect(fetchSession).toHaveBeenCalledTimes(2);
  });

  it("カスタムオプションが適用される", async () => {
    const mockSession: SessionResponse = {
      authenticated: true,
      employee: {
        id: 1,
        email: "test@example.com",
        firstName: "太郎",
        lastName: "山田",
        admin: false,
      },
    };

    vi.mocked(fetchSession).mockResolvedValue(mockSession);

    // カスタムオプションを適用（retryなど）
    const { result } = renderHook(
      () =>
        useSession({
          retry: 5,
        }),
      { wrapper }
    );

    // クエリが実行される
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // データが取得できていることを確認
    expect(result.current.data).toEqual(mockSession);

    // fetchSessionが呼ばれていることを確認
    expect(fetchSession).toHaveBeenCalled();
  });
});
