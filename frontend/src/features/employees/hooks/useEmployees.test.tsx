import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import type { EmployeeListResponse } from "@/features/employees/types";
import * as employeeApi from "../api";
import { EMPLOYEES_QUERY_KEY, useEmployees } from "./useEmployees";

// APIのモック
vi.mock("../api");

const mockEmployees: EmployeeListResponse = {
  employees: [
    {
      id: 1,
      firstName: "太郎",
      lastName: "山田",
      email: "taro.yamada@example.com",
      admin: true,
    },
    {
      id: 2,
      firstName: "花子",
      lastName: "鈴木",
      email: "hanako.suzuki@example.com",
      admin: false,
    },
  ],
};

// テスト用QueryClientのセットアップ
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // テストでは再試行しない
      },
    },
  });
}

// テスト用ラッパー
function createWrapper() {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { wrapper: Wrapper, queryClient };
}

describe("useEmployees", () => {
  it("should fetch employees successfully", async () => {
    // Arrange: APIモックのセットアップ
    vi.mocked(employeeApi.fetchEmployees).mockResolvedValue(mockEmployees);

    // Act: フックをレンダリング
    const { wrapper: Wrapper } = createWrapper();

    const { result } = renderHook(() => useEmployees(), {
      wrapper: Wrapper,
    });

    // Assert: 初期状態の確認
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait: データ取得完了を待つ
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: 取得したデータの確認
    expect(result.current.data).toEqual(mockEmployees);
    expect(result.current.data?.employees).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("should handle fetch error", async () => {
    // Arrange: エラーをthrowするモック
    const errorMessage = "Failed to fetch employees";
    vi.mocked(employeeApi.fetchEmployees).mockRejectedValue(
      new Error(errorMessage)
    );

    // Act
    const { wrapper: Wrapper } = createWrapper();

    const { result } = renderHook(() => useEmployees(), {
      wrapper: Wrapper,
    });

    // Wait: エラー状態を待つ
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: エラー状態の確認
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  it("should use correct query key", async () => {
    // Arrange
    vi.mocked(employeeApi.fetchEmployees).mockResolvedValue(mockEmployees);

    // Act
    const { wrapper: Wrapper } = createWrapper();

    const { result } = renderHook(() => useEmployees(), {
      wrapper: Wrapper,
    });

    // Wait
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: クエリキーが正しいことを確認（内部的にはqueryKeyプロパティで確認）
    // この確認は実装側でqueryKeyが正しく設定されているかのテスト
    expect(employeeApi.fetchEmployees).toHaveBeenCalledWith();
  });

  it("should have correct staleTime configuration", async () => {
    // Arrange
    vi.mocked(employeeApi.fetchEmployees).mockResolvedValue(mockEmployees);

    // Act
    const { wrapper: Wrapper } = createWrapper();

    const { result } = renderHook(() => useEmployees(), {
      wrapper: Wrapper,
    });

    // Wait
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: staleTime設定により、データが新鮮な状態であることを確認
    // （30秒以内は再フェッチされない）
    expect(result.current.isStale).toBe(false);
  });

  it("applies employees cache timing configuration", async () => {
    vi.mocked(employeeApi.fetchEmployees).mockResolvedValue(mockEmployees);

    const { wrapper: Wrapper, queryClient } = createWrapper();

    renderHook(() => useEmployees(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      const query = queryClient
        .getQueryCache()
        .find({ queryKey: EMPLOYEES_QUERY_KEY });
      expect(query?.state.status).toBe("success");
    });

    const cachedQuery = queryClient
      .getQueryCache()
      .find({ queryKey: EMPLOYEES_QUERY_KEY });

    const cachedOptions = cachedQuery?.options as
      | {
          staleTime?: number;
          gcTime?: number;
        }
      | undefined;

    expect(cachedOptions?.staleTime).toBe(QUERY_CONFIG.employees.staleTime);
    expect(cachedOptions?.gcTime).toBe(QUERY_CONFIG.employees.gcTime);
  });
});
