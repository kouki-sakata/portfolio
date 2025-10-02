import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import { fetchStampHistory } from "@/features/stampHistory/api";
import { queryKeys } from "@/shared/utils/queryUtils";
import { StampHistoryPage } from "./StampHistoryPage";

vi.mock("@/features/stampHistory/api", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchStampHistory: vi.fn(async () => ({
      entries: [],
      years: ["2025"],
      months: ["10"],
      selectedYear: "2025",
      selectedMonth: "10",
    })),
  };
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
    render(
      <QueryClientProvider client={queryClient}>
        <StampHistoryPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(fetchStampHistory).toHaveBeenCalledWith({});
    });

    const cachedQuery = queryClient
      .getQueryCache()
      .find({ queryKey: queryKeys.stampHistory.list() });

    expect(cachedQuery?.options.staleTime).toBe(
      QUERY_CONFIG.stampHistory.staleTime
    );
    expect(cachedQuery?.options.gcTime).toBe(QUERY_CONFIG.stampHistory.gcTime);
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
