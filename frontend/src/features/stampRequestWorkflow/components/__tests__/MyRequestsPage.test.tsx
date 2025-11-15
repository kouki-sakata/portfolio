import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockStampRequestList } from "@/features/stampRequestWorkflow/__fixtures__/requests";
import { MyRequestsPage } from "@/features/stampRequestWorkflow/components/MyRequestsPage";

const mockUseMyRequests = vi.fn();
const mockUseCreateMutation = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

vi.mock("@/features/stampRequestWorkflow/hooks/useStampRequests", () => ({
  useMyStampRequestsQuery: (...args: unknown[]) => mockUseMyRequests(...args),
  useCreateStampRequestMutation: () => mockUseCreateMutation(),
  useCancelStampRequestMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      firstName: "田中",
      lastName: "太郎",
      admin: false,
      email: "tanaka@example.com",
    },
  }),
}));

const renderPage = () => {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <MyRequestsPage />
    </QueryClientProvider>
  );
};

describe("MyRequestsPage", () => {
  beforeEach(() => {
    mockUseMyRequests.mockReturnValue({
      data: mockStampRequestList,
      isLoading: false,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders workspace header with role switch, command button, CTA, and user summary", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "勤怠ワークフロー" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "従業員ビュー" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.getByRole("button", { name: "⌘K コマンド" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "新しい申請" })
    ).toBeInTheDocument();
    expect(screen.getByText("田中 太郎")).toBeInTheDocument();
  });

  it("renders sidebar at 384px and shows request cards with unread indicator", () => {
    renderPage();

    const sidebar = screen.getByTestId("workflow-sidebar");
    expect(sidebar.className).toContain("lg:w-[384px]");
    expect(sidebar).toHaveTextContent("検索");
    expect(screen.getAllByLabelText("未読リクエスト").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("status", { name: "審査中" })).toHaveLength(1);
  });

  it("updates detail panel when selecting different request cards", async () => {
    renderPage();

    expect(screen.getByText(/家族の急用で退勤が遅れた/)).toBeInTheDocument();

    await userEvent.click(screen.getByText(/交通遅延で出勤時間がズレた/));

    expect(
      screen.getByText(/交通遅延で出勤時間がズレたため修正をお願いします/)
    ).toBeInTheDocument();
  });

  it("invokes query hook with filters and pagination changes", async () => {
    renderPage();
    expect(mockUseMyRequests).toHaveBeenCalledWith({
      page: 0,
      pageSize: 20,
      search: "",
      sort: "recent",
      status: "ALL",
    });

    await userEvent.click(screen.getByRole("tab", { name: "承認済み" }));
    expect(mockUseMyRequests).toHaveBeenLastCalledWith({
      page: 0,
      pageSize: 20,
      search: "",
      sort: "recent",
      status: "APPROVED",
    });

    await userEvent.click(screen.getByRole("button", { name: "次のページ" }));
    expect(mockUseMyRequests).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      search: "",
      sort: "recent",
      status: "APPROVED",
    });
  });

  it("applies filters via command palette actions", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "⌘K コマンド" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "保留のみ表示" }));
    expect(mockUseMyRequests).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "PENDING" })
    );
  });
});
