import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BulkActionBar } from "./BulkActionBar";

describe("BulkActionBar", () => {
  it("shows selected count and triggers handlers", async () => {
    const user = userEvent.setup();
    const onApproveSelected = vi.fn();
    const onRejectSelected = vi.fn();
    const onClear = vi.fn();

    render(
      <BulkActionBar
        isProcessing={false}
        onApproveSelected={onApproveSelected}
        onClearSelection={onClear}
        onRejectSelected={onRejectSelected}
        selectedIds={[10, 11, 12]}
      />
    );

    expect(screen.getByText("3件選択中")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "承認" }));
    expect(onApproveSelected).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "却下" }));
    expect(onRejectSelected).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "選択をクリア" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("disables buttons while processing", () => {
    render(
      <BulkActionBar
        isProcessing
        onApproveSelected={vi.fn()}
        onClearSelection={vi.fn()}
        onRejectSelected={vi.fn()}
        selectedIds={[1]}
      />
    );

    expect(screen.getByRole("button", { name: "承認" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "却下" })).toBeDisabled();
  });
});
