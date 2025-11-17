import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BulkActionBar } from "./BulkActionBar";

describe("BulkActionBar", () => {
  it("shows selected count and triggers handlers", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onReject = vi.fn();

    render(
      <BulkActionBar
        onApprove={onApprove}
        onReject={onReject}
        selectedCount={3}
      />
    );

    expect(screen.getByText("3件を選択中")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "承認" }));
    expect(onApprove).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "却下" }));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when selectedCount is 0", () => {
    const { container } = render(
      <BulkActionBar onApprove={vi.fn()} onReject={vi.fn()} selectedCount={0} />
    );

    expect(container.firstChild).toBeNull();
  });
});
