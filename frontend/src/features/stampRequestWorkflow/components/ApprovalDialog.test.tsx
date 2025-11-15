import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StampRequestListItem } from "@/features/stampRequestWorkflow/types";
import { ApprovalDialog } from "./ApprovalDialog";

const mocks = vi.hoisted(() => ({
  useApproveRequestMutation: vi.fn(),
}));

const toastMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/stampRequestWorkflow/hooks/useStampRequests", () => ({
  useApproveRequestMutation: mocks.useApproveRequestMutation,
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: toastMock,
}));

const baseRequest: StampRequestListItem = {
  id: 77,
  stampHistoryId: 301,
  dateLabel: "2025/11/12",
  status: "PENDING",
  reason: "退勤が記録されていないため修正します。",
  submittedAt: "2025-11-12 10:00",
  submittedTimestamp: 1_731_396_000_000,
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
};

const renderDialog = (override?: Partial<StampRequestListItem>) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ApprovalDialog
        onOpenChange={vi.fn()}
        open
        request={{ ...baseRequest, ...override }}
      />
    </QueryClientProvider>
  );
};

describe("ApprovalDialog", () => {
  beforeEach(() => {
    toastMock.mockReset();
  });

  it("allows admin to submit optional note", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mocks.useApproveRequestMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    renderDialog();

    expect(screen.getByText("原本: 09:00 - 18:00")).toBeInTheDocument();
    expect(screen.getByText("修正案: 09:30 - 18:30")).toBeInTheDocument();

    await user.type(screen.getByLabelText("承認メモ"), "メモ");
    await user.click(screen.getByRole("button", { name: "承認を確定" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      approvalNote: "メモ",
      requestId: 77,
    });
  });

  it("surfaces conflict errors via toast", async () => {
    const user = userEvent.setup();
    const error = { status: 409, message: "conflict" };
    const mutateAsync = vi.fn().mockRejectedValue(error);
    mocks.useApproveRequestMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    renderDialog();

    await user.click(screen.getByRole("button", { name: "承認を確定" }));

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" })
    );
  });
});
