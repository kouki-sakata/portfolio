import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StampRequestListItem } from "@/features/stampRequestWorkflow/types";
import { WorkflowSidebar } from "../WorkflowSidebar";

const mockRequests: StampRequestListItem[] = [
  {
    id: 1,
    stampHistoryId: 45,
    dateLabel: "2025/11/07",
    status: "PENDING",
    reason: "家族の急用で退勤が遅れたため修正が必要です。",
    createdAt: "2025-11-07T19:05:00+09:00",
    submittedTimestamp: 1_762_522_305_000,
    employeeName: "田中 太郎",
    requestedInTime: "2025-11-07T09:00:00+09:00",
    requestedOutTime: "2025-11-07T18:30:00+09:00",
    requestedBreakStartTime: "2025-11-07T12:10:00+09:00",
    requestedBreakEndTime: "2025-11-07T13:05:00+09:00",
    approvalNote: null,
    rejectionReason: null,
    unread: true,
  },
  {
    id: 2,
    stampHistoryId: 46,
    dateLabel: "2025/11/06",
    status: "APPROVED",
    reason:
      "交通遅延で出勤時間がズレたため修正をお願いします（証明書添付済み）。",
    createdAt: "2025-11-06T08:45:00+09:00",
    submittedTimestamp: 1_699_277_100_000,
    employeeName: "佐藤 花子",
    requestedInTime: "2025-11-06T10:30:00+09:00",
    requestedOutTime: "2025-11-06T19:00:00+09:00",
    requestedBreakStartTime: null,
    requestedBreakEndTime: null,
    approvalNote: "承認しました",
    rejectionReason: null,
    unread: false,
  },
  {
    id: 3,
    stampHistoryId: 47,
    dateLabel: "2025/11/05",
    status: "REJECTED",
    reason: "体調不良で早退しました。",
    createdAt: "2025-11-05T14:20:00+09:00",
    submittedTimestamp: 1_699_177_200_000,
    employeeName: "鈴木 一郎",
    requestedInTime: "2025-11-05T09:00:00+09:00",
    requestedOutTime: "2025-11-05T15:00:00+09:00",
    requestedBreakStartTime: null,
    requestedBreakEndTime: null,
    approvalNote: null,
    rejectionReason: "証明書が不足しています",
    unread: false,
  },
];

describe("WorkflowSidebar", () => {
  describe("Time formatting", () => {
    it("should format ISO 8601 createdAt to Japanese datetime format", () => {
      render(
        <WorkflowSidebar
          isLoading={false}
          onSearchChange={vi.fn()}
          onSelectRequest={vi.fn()}
          onSortChange={vi.fn()}
          onStatusChange={vi.fn()}
          requests={mockRequests}
          searchQuery=""
          selectedId={null}
          sortBy="submittedAt"
          statusFilter="ALL"
          userRole="employee"
        />
      );

      // 各リクエストの提出日時が "YYYY/MM/DD HH:mm" 形式で表示される
      expect(
        screen.getByText(/提出:\s*2025\/11\/07 19:05/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/提出:\s*2025\/11\/06 08:45/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/提出:\s*2025\/11\/05 14:20/)
      ).toBeInTheDocument();
    });

    it("should display 'N/A' when createdAt is null", () => {
      const requestsWithNullCreatedAt: StampRequestListItem[] = [
        {
          ...mockRequests[0],
          createdAt: null as unknown as string,
        } as StampRequestListItem,
      ];

      render(
        <WorkflowSidebar
          isLoading={false}
          onSearchChange={vi.fn()}
          onSelectRequest={vi.fn()}
          onSortChange={vi.fn()}
          onStatusChange={vi.fn()}
          requests={requestsWithNullCreatedAt}
          searchQuery=""
          selectedId={null}
          sortBy="submittedAt"
          statusFilter="ALL"
          userRole="employee"
        />
      );

      // null の場合は "N/A" が表示される
      expect(screen.getByText(/提出:\s*N\/A/)).toBeInTheDocument();
    });
  });

  describe("Employee view", () => {
    it("should display all requests for employee", () => {
      render(
        <WorkflowSidebar
          isLoading={false}
          onSearchChange={vi.fn()}
          onSelectRequest={vi.fn()}
          onSortChange={vi.fn()}
          onStatusChange={vi.fn()}
          requests={mockRequests}
          searchQuery=""
          selectedId={null}
          sortBy="submittedAt"
          statusFilter="ALL"
          userRole="employee"
        />
      );

      expect(screen.getByText("2025/11/07")).toBeInTheDocument();
      expect(screen.getByText("2025/11/06")).toBeInTheDocument();
      expect(screen.getByText("2025/11/05")).toBeInTheDocument();
    });

    it("should display request reasons", () => {
      render(
        <WorkflowSidebar
          isLoading={false}
          onSearchChange={vi.fn()}
          onSelectRequest={vi.fn()}
          onSortChange={vi.fn()}
          onStatusChange={vi.fn()}
          requests={mockRequests}
          searchQuery=""
          selectedId={null}
          sortBy="submittedAt"
          statusFilter="ALL"
          userRole="employee"
        />
      );

      expect(
        screen.getByText("家族の急用で退勤が遅れたため修正が必要です。")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "交通遅延で出勤時間がズレたため修正をお願いします（証明書添付済み）。"
        )
      ).toBeInTheDocument();
    });
  });

  describe("Admin view", () => {
    it("should display employee names for admin", () => {
      render(
        <WorkflowSidebar
          isLoading={false}
          onSearchChange={vi.fn()}
          onSelectRequest={vi.fn()}
          onSortChange={vi.fn()}
          onStatusChange={vi.fn()}
          requests={mockRequests}
          searchQuery=""
          selectedId={null}
          sortBy="submittedAt"
          statusFilter="ALL"
          userRole="admin"
        />
      );

      expect(screen.getByText("田中 太郎")).toBeInTheDocument();
      expect(screen.getByText("佐藤 花子")).toBeInTheDocument();
      expect(screen.getByText("鈴木 一郎")).toBeInTheDocument();
    });

    it("should format submission times for all requests", () => {
      render(
        <WorkflowSidebar
          isLoading={false}
          onSearchChange={vi.fn()}
          onSelectRequest={vi.fn()}
          onSortChange={vi.fn()}
          onStatusChange={vi.fn()}
          requests={mockRequests}
          searchQuery=""
          selectedId={null}
          sortBy="submittedAt"
          statusFilter="ALL"
          userRole="admin"
        />
      );

      // すべての提出日時が正しくフォーマットされている
      expect(
        screen.getByText(/提出:\s*2025\/11\/07 19:05/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/提出:\s*2025\/11\/06 08:45/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/提出:\s*2025\/11\/05 14:20/)
      ).toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("should display skeleton loaders when loading", () => {
      const { container } = render(
        <WorkflowSidebar
          isLoading={true}
          onSearchChange={vi.fn()}
          onSelectRequest={vi.fn()}
          onSortChange={vi.fn()}
          onStatusChange={vi.fn()}
          requests={[]}
          searchQuery=""
          selectedId={null}
          sortBy="submittedAt"
          statusFilter="ALL"
          userRole="employee"
        />
      );

      // スケルトンが表示されることを確認（クラス名でチェック）
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Empty state", () => {
    it("should display empty message when no requests", () => {
      render(
        <WorkflowSidebar
          isLoading={false}
          onSearchChange={vi.fn()}
          onSelectRequest={vi.fn()}
          onSortChange={vi.fn()}
          onStatusChange={vi.fn()}
          requests={[]}
          searchQuery=""
          selectedId={null}
          sortBy="submittedAt"
          statusFilter="ALL"
          userRole="employee"
        />
      );

      expect(screen.getByText("申請が見つかりません")).toBeInTheDocument();
    });
  });
});
