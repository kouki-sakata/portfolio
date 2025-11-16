import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { StampRequestListItem } from "@/features/stampRequestWorkflow/types";
import { RejectionDialog } from "./RejectionDialog";

const mocks = vi.hoisted(() => ({
  useRejectRequestMutation: vi.fn(),
}));

vi.mock("@/features/stampRequestWorkflow/hooks/useStampRequests", () => ({
  useRejectRequestMutation: mocks.useRejectRequestMutation,
}));

const renderDialog = (request: StampRequestListItem) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RejectionDialog onOpenChange={vi.fn()} open request={request} />
    </QueryClientProvider>
  );
};

const baseRequest: StampRequestListItem = {
  id: 91,
  stampHistoryId: 45,
  dateLabel: "2025/11/12",
  status: "PENDING",
  reason: "退勤時刻が誤って記録されたため修正します。",
  submittedAt: "2025-11-12 08:15",
  submittedTimestamp: 1_731_388_800_000,
  employeeName: "佐藤 花子",
  requestedInTime: "08:00",
  requestedOutTime: "17:00",
  requestedBreakStartTime: "12:00",
  requestedBreakEndTime: "12:45",
  originalInTime: "08:00",
  originalOutTime: "17:30",
  originalBreakStartTime: "12:00",
  originalBreakEndTime: "12:45",
  approvalNote: null,
  rejectionReason: null,
  unread: false,
};

describe("RejectionDialog", () => {
  it("requires rejection reason with minimum length", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mocks.useRejectRequestMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    renderDialog(baseRequest);

    await user.click(screen.getByRole("button", { name: "却下を確定" }));
    expect(
      screen.getByText("理由は10文字以上500文字以下で入力してください")
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("却下理由"), "証跡と一致しません。");
    await user.click(screen.getByRole("button", { name: "却下を確定" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });
  });
});
