import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import type { StampRequestListItem } from "@/features/stampRequestWorkflow/types";
import { PendingRequestsAdminPage } from "./PendingRequestsAdminPage";

const mocks = vi.hoisted(() => ({
  usePendingStampRequestsQuery: vi.fn(),
  useBulkApproveRequestsMutation: vi.fn(),
  useBulkRejectRequestsMutation: vi.fn(),
  useApproveRequestMutation: vi.fn(),
  useRejectRequestMutation: vi.fn(),
}));

vi.mock("@/features/stampRequestWorkflow/hooks/useStampRequests", () => ({
  usePendingStampRequestsQuery: mocks.usePendingStampRequestsQuery,
  useBulkApproveRequestsMutation: mocks.useBulkApproveRequestsMutation,
  useBulkRejectRequestsMutation: mocks.useBulkRejectRequestsMutation,
  useApproveRequestMutation: mocks.useApproveRequestMutation,
  useRejectRequestMutation: mocks.useRejectRequestMutation,
}));

const toastMocks = vi.hoisted(() => ({
  toast: vi.fn(),
}));
vi.mock("@/hooks/use-toast", () => ({ toast: toastMocks.toast }));

vi.mock("@/shared/components/data-table/DataTable", () => ({
  DataTable: ({
    onRowSelectionChange,
  }: {
    onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  }) => (
    <div>
      <button
        onClick={() => {
          onRowSelectionChange?.({ 0: true });
        }}
        type="button"
      >
        select-one
      </button>
      <button
        onClick={() => {
          const overflowSelection = Object.fromEntries(
            Array.from({ length: 51 }).map((_, index) => [index, true])
          );
          onRowSelectionChange?.(overflowSelection);
        }}
        type="button"
      >
        select-overflow
      </button>
    </div>
  ),
}));

vi.mock("@/features/stampRequestWorkflow/components/BulkActionBar", () => ({
  BulkActionBar: ({ selectedIds }: { selectedIds: number[] }) => {
    if (selectedIds.length === 0) {
      return null;
    }
    return <div data-testid="bulk-bar">{selectedIds.length}件</div>;
  },
}));

const sampleRequest = (): StampRequestListItem => ({
  id: 1,
  stampHistoryId: 100,
  dateLabel: "2025/11/12",
  status: "PENDING",
  reason: "退勤が記録されていないため修正します。",
  submittedAt: "2025-11-12 10:00",
  submittedTimestamp: 1731396000000,
  employeeName: "太郎 山田",
  requestedInTime: "09:30",
  requestedOutTime: "18:30",
  requestedBreakStartTime: "12:00",
  requestedBreakEndTime: "12:45",
  originalInTime: "09:00",
  originalOutTime: "18:00",
  originalBreakStartTime: "12:00",
  originalBreakEndTime: "12:45",
  approvalNote: null,
  rejectionReason: null,
  unread: true,
});

beforeEach(() => {
  toastMocks.toast.mockReset();
  mocks.usePendingStampRequestsQuery.mockReturnValue({
    data: {
      requests: [sampleRequest()],
      totalCount: 1,
      pageNumber: 0,
      pageSize: 20,
    },
    isLoading: false,
  });
  mocks.useBulkApproveRequestsMutation.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({
      successCount: 0,
      failureCount: 0,
      failedRequestIds: [],
    }),
    isPending: false,
  });
  mocks.useBulkRejectRequestsMutation.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({
      successCount: 0,
      failureCount: 0,
      failedRequestIds: [],
    }),
    isPending: false,
  });
  mocks.useApproveRequestMutation.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  mocks.useRejectRequestMutation.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
});

describe("PendingRequestsAdminPage", () => {
  it("renders skeletons while loading", () => {
    mocks.usePendingStampRequestsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PendingRequestsAdminPage />
      </QueryClientProvider>
    );

    expect(screen.getAllByTestId("pending-row-skeleton")).toHaveLength(3);
  });

  it("shows request detail and allows valid selections", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PendingRequestsAdminPage />
      </QueryClientProvider>
    );

    expect(screen.getByText("太郎 山田")).toBeInTheDocument();

    await user.click(screen.getByText("select-one"));
    expect(screen.getByTestId("bulk-bar")).toHaveTextContent("1件");
  });

  it("prevents selections beyond 50 rows", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PendingRequestsAdminPage />
      </QueryClientProvider>
    );

    await user.click(screen.getByText("select-overflow"));
    expect(toastMocks.toast).toHaveBeenCalled();
    expect(screen.queryByTestId("bulk-bar")).not.toBeInTheDocument();
  });
});
