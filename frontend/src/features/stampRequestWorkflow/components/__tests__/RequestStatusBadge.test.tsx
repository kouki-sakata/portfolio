import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RequestStatusBadge } from "@/features/stampRequestWorkflow/components/RequestStatusBadge";
import type { StampRequestStatus } from "@/features/stampRequestWorkflow/types";

const renderBadge = (status: StampRequestStatus) =>
  render(<RequestStatusBadge status={status} />);

describe("RequestStatusBadge", () => {
  it("renders pending state with amber badge", () => {
    renderBadge("PENDING");

    const badge = screen.getByRole("status", { name: "審査中" });
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-amber-100");
  });

  it("renders approved state with emerald badge", () => {
    renderBadge("APPROVED");

    const badge = screen.getByRole("status", { name: "承認済み" });
    expect(badge.className).toContain("bg-emerald-100");
  });

  it("falls back to neutral badge for NONE", () => {
    renderBadge("NONE");
    expect(
      screen.getByRole("status", { name: "未申請" })
    ).toHaveClass("bg-slate-200");
  });
});
