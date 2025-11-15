import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RequestCorrectionModal } from "@/features/stampRequestWorkflow/components/RequestCorrectionModal";
import { mockStampHistoryEntry } from "@/features/stampRequestWorkflow/__fixtures__/requests";

const mutateAsync = vi.fn();

vi.mock("@/features/stampRequestWorkflow/hooks/useStampRequests", () => ({
  useCreateStampRequestMutation: () => ({
    mutateAsync,
    isPending: false,
  }),
}));

const renderModal = () => {
  const queryClient = new QueryClient();
  const onOpenChange = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <RequestCorrectionModal
        entry={mockStampHistoryEntry}
        onOpenChange={onOpenChange}
        open
      />
    </QueryClientProvider>
  );

  return { onOpenChange };
};

describe("RequestCorrectionModal", () => {
  beforeEach(() => {
    mutateAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("prefills the form with selected stamp entry values", () => {
    renderModal();

    expect(screen.getByLabelText("出勤時刻")).toHaveValue("09:00");
    expect(screen.getByLabelText("退勤時刻")).toHaveValue("18:10");
    expect(screen.getByLabelText("休憩開始")).toHaveValue("12:00");
    expect(screen.getByLabelText("休憩終了")).toHaveValue("13:00");
  });

  it("shows validation error when reason is too short", async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText("修正理由"), {
      target: { value: "短い" },
    });
    await userEvent.click(screen.getByRole("button", { name: "リクエスト送信" }));

    expect(
      await screen.findByText("理由は10文字以上500文字以下で入力してください")
    ).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("submits the form and closes modal on success", async () => {
    const { onOpenChange } = renderModal();

    fireEvent.change(screen.getByLabelText("修正理由"), {
      target: {
        value:
          "システム障害で退勤打刻がずれたため、正しい時刻へ修正をお願いします。",
      },
    });

    await userEvent.click(screen.getByRole("button", { name: "リクエスト送信" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        stampHistoryId: mockStampHistoryEntry.id,
        requestedInTime: "09:00",
        requestedOutTime: "18:10",
        requestedBreakStartTime: "12:00",
        requestedBreakEndTime: "13:00",
        requestedIsNightShift: false,
        reason:
          "システム障害で退勤打刻がずれたため、正しい時刻へ修正をお願いします。",
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
