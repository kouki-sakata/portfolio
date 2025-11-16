import { render, screen } from "@testing-library/react";
import { type ReactNode, Suspense } from "react";
import { describe, expect, it, vi } from "vitest";

import { PendingRequestsRoute } from "./PendingRequestsRoute";

const useLoaderDataMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useLoaderData: () => useLoaderDataMock(),
  };
});

vi.mock("@/shared/components/guards/AdminGuard", () => ({
  AdminGuard: ({ children }: { children: ReactNode }) => (
    <div data-testid="admin-guard">{children}</div>
  ),
}));

vi.mock("@/shared/components/loading/SuspenseWrapper", () => ({
  PageSuspenseWrapper: ({ children }: { children: ReactNode }) => (
    <div data-testid="suspense-wrapper">{children}</div>
  ),
}));

vi.mock(
  "@/features/stampRequestWorkflow/components/PendingRequestsAdminPage",
  () => ({
    PendingRequestsAdminPage: () => (
      <div data-testid="pending-admin-page">pending-admin</div>
    ),
  })
);

describe("PendingRequestsRoute", () => {
  it("wraps admin page with guard and suspense boundary", async () => {
    useLoaderDataMock.mockReturnValue({ authenticated: true });

    render(
      <Suspense fallback={<div>loading</div>}>
        <PendingRequestsRoute />
      </Suspense>
    );

    expect(await screen.findByTestId("admin-guard")).toBeInTheDocument();
    expect(await screen.findByTestId("suspense-wrapper")).toBeInTheDocument();
    expect(await screen.findByTestId("pending-admin-page")).toBeInTheDocument();
  });
});
