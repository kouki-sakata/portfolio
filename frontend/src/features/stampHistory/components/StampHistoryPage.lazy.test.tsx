import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { Suspense, lazy } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "@/features/auth/context/AuthProvider";

// Lazy load the components to test code splitting
const LazyCalendarView = lazy(() =>
  import("./CalendarView").then((module) => ({
    default: module.CalendarView,
  }))
);

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

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("StampHistoryPage Component Lazy Loading", () => {
  describe("CalendarView Lazy Loading", () => {
    it("should render fallback while loading lazy CalendarView component", () => {
      render(
        <TestWrapper>
          <Suspense fallback={<div data-testid="calendar-loading">Loading calendar...</div>}>
            <LazyCalendarView
              entries={mockStampHistoryData.entries}
              selectedMonth="10"
              selectedYear="2025"
            />
          </Suspense>
        </TestWrapper>
      );

      // Fallback should be visible initially
      expect(screen.getByTestId("calendar-loading")).toBeInTheDocument();
    });

    it("should render CalendarView after lazy loading completes", async () => {
      render(
        <TestWrapper>
          <Suspense fallback={<div data-testid="calendar-loading">Loading calendar...</div>}>
            <LazyCalendarView
              entries={mockStampHistoryData.entries}
              selectedMonth="10"
              selectedYear="2025"
            />
          </Suspense>
        </TestWrapper>
      );

      // Wait for lazy component to load and render
      // Use findByText which automatically waits for element to appear
      const heading = await screen.findByText("カレンダー表示", {}, { timeout: 5000 });
      expect(heading).toBeInTheDocument();

      // Fallback should be removed
      expect(screen.queryByTestId("calendar-loading")).not.toBeInTheDocument();
    });

    it("should properly code-split CalendarView component", async () => {
      // Verify that lazy loading returns a promise
      const lazyPromise = import("./CalendarView");
      expect(lazyPromise).toBeInstanceOf(Promise);

      // Verify that the module exports the expected component
      const module = await lazyPromise;
      expect(module.CalendarView).toBeDefined();
      expect(typeof module.CalendarView).toBe("function");
    });
  });

  describe("MonthlyStatsCard Lazy Loading", () => {
    it("should render fallback while loading lazy MonthlyStatsCard component", () => {
      render(
        <TestWrapper>
          <Suspense fallback={<div data-testid="stats-loading">Loading stats...</div>}>
            <LazyMonthlyStatsCard entries={mockStampHistoryData.entries} />
          </Suspense>
        </TestWrapper>
      );

      // Fallback should be visible initially
      expect(screen.getByTestId("stats-loading")).toBeInTheDocument();
    });

    it("should render MonthlyStatsCard after lazy loading completes", async () => {
      render(
        <TestWrapper>
          <Suspense fallback={<div data-testid="stats-loading">Loading stats...</div>}>
            <LazyMonthlyStatsCard entries={mockStampHistoryData.entries} />
          </Suspense>
        </TestWrapper>
      );

      // Wait for lazy component to load and render
      // Use findByText which automatically waits for element to appear
      const heading = await screen.findByText("月次統計", {}, { timeout: 5000 });
      expect(heading).toBeInTheDocument();

      // Fallback should be removed
      expect(screen.queryByTestId("stats-loading")).not.toBeInTheDocument();
    });

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
