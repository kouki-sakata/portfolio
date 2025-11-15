import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CancellationDialog } from "@/features/stampRequestWorkflow/components/CancellationDialog";

const cancelMutation = vi.fn();

vi.mock("@/features/stampRequestWorkflow/hooks/useStampRequests", () => ({
  useCancelStampRequestMutation: () => ({
    mutateAsync: cancelMutation,
    isPending: false,
  }),
}));

const renderDialog = () => {
  const queryClient = new QueryClient();
  const onOpenChange = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <CancellationDialog
        onOpenChange={onOpenChange}
        open
        requestId={mockRequestId}
      />
    </QueryClientProvider>
  );

  return { onOpenChange };
};

const mockRequestId = 101;

describe("CancellationDialog", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation error when cancellation reason is missing", async () => {
    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "取消を確定" }));

    expect(
      await screen.findByText("10文字以上500文字以下で理由を入力してください")
    ).toBeInTheDocument();
    expect(cancelMutation).not.toHaveBeenCalled();
  });

  it("submits cancellation request with reason", async () => {
    const { onOpenChange } = renderDialog();

    fireEvent.change(screen.getByLabelText("取消理由"), {
      target: {
        value:
          "誤って申請したため取り消します。更新後に改めて正しい内容を送ります。",
      },
    });

    await userEvent.click(screen.getByRole("button", { name: "取消を確定" }));

    await waitFor(() => {
      expect(cancelMutation).toHaveBeenCalledWith({
        requestId: mockRequestId,
        reason:
          "誤って申請したため取り消します。更新後に改めて正しい内容を送ります。",
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
