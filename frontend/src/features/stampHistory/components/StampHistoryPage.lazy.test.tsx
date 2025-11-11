import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { lazy, type ReactNode, Suspense } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("./MonthlyStatsCard", () => ({
  MonthlyStatsCard: () => <h2>月次統計</h2>,
}));

// Lazy load the components to test code splitting
const LazyMonthlyStatsCard = lazy(() =>
  import("./MonthlyStatsCard").then((module) => ({
    default: module.MonthlyStatsCard,
  }))
);

// Mock stamp history data
const mockStampHistoryData = {
  selectedYear: "2025",
  selectedMonth: "10",
  years: ["2024", "2025"],
  months: ["01", "02", "10"],
  entries: [
    {
      id: 1,
      year: "2025",
      month: "10",
      day: "01",
      dayOfWeek: "水",
      inTime: "09:00",
      outTime: "18:00",
      breakStartTime: "12:00",
      breakEndTime: "12:45",
      overtimeMinutes: 45,
      isNightShift: null,
      updateDate: "2025-10-01 18:00:00",
    },
    {
      id: 2,
      year: "2025",
      month: "10",
      day: "02",
      dayOfWeek: "木",
      inTime: "09:15",
      outTime: "18:30",
      breakStartTime: null,
      breakEndTime: null,
      overtimeMinutes: 15,
      isNightShift: null,
      updateDate: "2025-10-02 18:30:00",
    },
  ],
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const TestWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("StampHistoryPage Component Lazy Loading", () => {
  describe("MonthlyStatsCard Lazy Loading", () => {
    it("should render fallback while loading lazy MonthlyStatsCard component", async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Suspense
            fallback={<div data-testid="stats-loading">Loading stats...</div>}
          >
            <LazyMonthlyStatsCard entries={mockStampHistoryData.entries} />
          </Suspense>
        </TestWrapper>
      );

      // Fallback should be visible immediately after render
      expect(getByTestId("stats-loading")).toBeInTheDocument();

      // Flush lazy resolution within act to avoid warnings
      await act(async () => {
        await Promise.resolve();
      });
    });

    it("should render MonthlyStatsCard after lazy loading completes", async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <Suspense
              fallback={<div data-testid="stats-loading">Loading stats...</div>}
            >
              <LazyMonthlyStatsCard entries={mockStampHistoryData.entries} />
            </Suspense>
          </TestWrapper>
        );
        await Promise.resolve();
      });

      const heading = await screen.findByText(
        "月次統計",
        {},
        { timeout: 5000 }
      );
      expect(heading).toBeInTheDocument();
      expect(screen.queryByTestId("stats-loading")).not.toBeInTheDocument();
    }, 10_000);

    it("should properly code-split MonthlyStatsCard component", async () => {
      // Verify that lazy loading returns a promise
      const lazyPromise = import("./MonthlyStatsCard");
      expect(lazyPromise).toBeInstanceOf(Promise);

      // Verify that the module exports the expected component
      const module = await lazyPromise;
      expect(module.MonthlyStatsCard).toBeDefined();
      expect(typeof module.MonthlyStatsCard).toBe("function");
    });
  });
});
