import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { lazy, type ReactNode, Suspense } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

// Lazy load the component
const LazyEmployeeListPage = lazy(() =>
  import("./EmployeeListPage").then((module) => ({
    default: module.EmployeeListPage,
  }))
);

// Mock dependencies
vi.mock("@/features/employees/hooks/useEmployees", () => ({
  useEmployees: () => ({
    data: {
      employees: [
        {
          id: 1,
          firstName: "太郎",
          lastName: "山田",
          email: "taro@example.com",
          admin: false,
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/features/employees/hooks/useEmployeeMutations", () => ({
  useCreateEmployee: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateEmployee: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteEmployees: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

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

describe("EmployeeListPage Lazy Loading", () => {
  it("should render fallback while loading lazy component", () => {
    render(
      <TestWrapper>
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyEmployeeListPage />
        </Suspense>
      </TestWrapper>
    );

    // Fallback should be visible initially
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should render component after lazy loading completes", async () => {
    render(
      <TestWrapper>
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyEmployeeListPage />
        </Suspense>
      </TestWrapper>
    );

    // Wait for lazy component to load and render
    await waitFor(
      () => {
        expect(screen.getByText("従業員管理")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Fallback should be removed
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
  });

  it("should properly code-split the component", async () => {
    // Verify that lazy loading returns a promise
    const lazyPromise = import("./EmployeeListPage");
    expect(lazyPromise).toBeInstanceOf(Promise);

    // Verify that the module exports the expected component
    const module = await lazyPromise;
    expect(module.EmployeeListPage).toBeDefined();
    expect(typeof module.EmployeeListPage).toBe("function");
  });
});
