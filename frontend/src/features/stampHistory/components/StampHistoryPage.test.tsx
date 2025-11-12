import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import { fetchStampHistory } from "@/features/stampHistory/api";
import { queryKeys } from "@/shared/utils/queryUtils";
import { StampHistoryPage } from "./StampHistoryPage";

type StampHistoryApiModule = typeof import("@/features/stampHistory/api");

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, firstName: "Test", lastName: "User", email: "test@example.com", admin: false },
    authenticated: true,
    loading: false,
  })),
}));

vi.mock("@/features/stampHistory/api", async (importOriginal) => {
  const actual = (await importOriginal()) as StampHistoryApiModule;
  return {
    ...actual,
    fetchStampHistory: vi.fn(async () => ({
      entries: [],
      years: ["2025"],
      months: ["10"],
      selectedYear: "2025",
      selectedMonth: "10",
      summary: {
        totalWorkingDays: 0,
        presentDays: 0,
        absentDays: 0,
        totalWorkingHours: 0,
        averageWorkingHours: 0,
        totalOvertimeMinutes: 0,
      },
    })),
  } satisfies StampHistoryApiModule;
});

describe("StampHistoryPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("applies stamp history cache configuration", async () => {
    // 現在の年月を取得（StampHistoryPageのデフォルト値と一致させる）
    const now = new Date();
    const expectedYear = now.getFullYear().toString();
    const expectedMonth = (now.getMonth() + 1).toString().padStart(2, "0");

    render(
      <QueryClientProvider client={queryClient}>
        <StampHistoryPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(fetchStampHistory).toHaveBeenCalledWith({
        year: expectedYear,
        month: expectedMonth,
      });
    });

    const cachedQuery = queryClient.getQueryCache().find({
      queryKey: queryKeys.stampHistory.list({
        year: expectedYear,
        month: expectedMonth,
      }),
    });

    const cachedOptions = cachedQuery?.options as
      | {
          staleTime?: number;
          gcTime?: number;
        }
      | undefined;

    expect(cachedOptions?.staleTime).toBe(QUERY_CONFIG.stampHistory.staleTime);
    expect(cachedOptions?.gcTime).toBe(QUERY_CONFIG.stampHistory.gcTime);
  });

  it("renders the heading after data loads", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <StampHistoryPage />
      </QueryClientProvider>
    );

    expect(
      await screen.findByRole("heading", { name: "打刻履歴" })
    ).toBeInTheDocument();
  });
});
