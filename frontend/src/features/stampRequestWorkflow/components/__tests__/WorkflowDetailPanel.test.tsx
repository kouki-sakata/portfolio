import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StampRequestListItem } from "@/features/stampRequestWorkflow/types";
import { WorkflowDetailPanel } from "../WorkflowDetailPanel";

const mockPendingRequest: StampRequestListItem = {
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
};

const mockApprovedRequest: StampRequestListItem = {
  ...mockPendingRequest,
  id: 2,
  status: "APPROVED",
  createdAt: "2025-11-06T08:45:00+09:00",
  unread: false,
};

const mockRejectedRequest: StampRequestListItem = {
  ...mockPendingRequest,
  id: 3,
  status: "REJECTED",
  rejectionReason: "証明書が不足しています",
  createdAt: "2025-11-05T14:20:00+09:00",
  unread: false,
};

describe("WorkflowDetailPanel", () => {
  describe("No selection", () => {
    it("should display placeholder when no request is selected", () => {
      render(
        <WorkflowDetailPanel
          request={null}
          role="employee"
          onApprove={() => {}}
          onReject={() => {}}
          onCancel={() => {}}
          onEdit={() => {}}
        />
      );

      expect(
        screen.getByText("申請を選択してください")
      ).toBeInTheDocument();
    });
  });

  describe("Time formatting", () => {
    it("should format ISO 8601 createdAt to Japanese datetime format", () => {
      render(
        <WorkflowDetailPanel
          request={mockPendingRequest}
          role="employee"
          onApprove={() => {}}
          onReject={() => {}}
          onCancel={() => {}}
          onEdit={() => {}}
        />
      );

      // 提出日時が "YYYY/MM/DD HH:mm" 形式で表示される
      expect(screen.getByText("2025/11/07 19:05")).toBeInTheDocument();
    });

    it("should extract time (HH:mm) from ISO 8601 requestedInTime and requestedOutTime", () => {
      render(
        <WorkflowDetailPanel
          request={mockPendingRequest}
          role="employee"
          onApprove={() => {}}
          onReject={() => {}}
          onCancel={() => {}}
          onEdit={() => {}}
        />
      );

      // 勤務時間が "HH:mm 〜 HH:mm" 形式で表示される
      expect(screen.getByText(/09:00\s*〜\s*18:30/)).toBeInTheDocument();
    });

    it("should display '--' when requestedInTime is null", () => {
      const requestWithNullTime = {
        ...mockPendingRequest,
        requestedInTime: null,
        requestedOutTime: null,
      };

      render(
        <WorkflowDetailPanel
          request={requestWithNullTime}
          role="employee"
          onApprove={() => {}}
          onReject={() => {}}
          onCancel={() => {}}
          onEdit={() => {}}
        />
      );

      // null の場合は "--" が表示される
      expect(screen.getByText(/--\s*〜\s*--/)).toBeInTheDocument();
    });
  });

  describe("Employee view", () => {
    it("should display edit and cancel buttons for pending request", () => {
      render(
        <WorkflowDetailPanel
          request={mockPendingRequest}
          role="employee"
          onApprove={() => {}}
          onReject={() => {}}
          onCancel={() => {}}
          onEdit={() => {}}
        />
      );

      expect(screen.getByText("申請を編集する")).toBeInTheDocument();
      expect(
        screen.getByText("申請をキャンセルする")
      ).toBeInTheDocument();
    });

    it("should display resubmit button for rejected request", () => {
      render(
        <WorkflowDetailPanel
          request={mockRejectedRequest}
          role="employee"
          onApprove={() => {}}
          onReject={() => {}}
          onCancel={() => {}}
          onEdit={() => {}}
        />
      );

      expect(screen.getByText("修正して再申請する")).toBeInTheDocument();
      expect(screen.getByText("証明書が不足しています")).toBeInTheDocument();
    });

    it("should display approved message for approved request", () => {
      render(
        <WorkflowDetailPanel
          request={mockApprovedRequest}
          role="employee"
          onApprove={() => {}}
          onReject={() => {}}
          onCancel={() => {}}
          onEdit={() => {}}
        />
      );

      expect(
        screen.getByText("✓ この申請は承認済みです")
      ).toBeInTheDocument();
    });
  });

  describe("Admin view", () => {
    it("should display employee name for admin", () => {
      render(
        <WorkflowDetailPanel
          request={mockPendingRequest}
          role="admin"
          onApprove={() => {}}
          onReject={() => {}}
          onCancel={() => {}}
          onEdit={() => {}}
        />
      );

      expect(screen.getByText(/申請者:\s*田中 太郎/)).toBeInTheDocument();
    });

    it("should display approve and reject buttons for pending request", () => {
      render(
        <WorkflowDetailPanel
          request={mockPendingRequest}
          role="admin"
          onApprove={() => {}}
          onReject={() => {}}
          onCancel={() => {}}
          onEdit={() => {}}
        />
      );

      expect(screen.getByText("承認する")).toBeInTheDocument();
      expect(screen.getByText("却下する")).toBeInTheDocument();
    });

    it("should format all datetime fields correctly", () => {
      render(
        <WorkflowDetailPanel
          request={mockApprovedRequest}
          role="admin"
          onApprove={() => {}}
          onReject={() => {}}
          onCancel={() => {}}
          onEdit={() => {}}
        />
      );

      // 提出日時が正しくフォーマットされている
      expect(screen.getByText("2025/11/06 08:45")).toBeInTheDocument();
    });
  });

  describe("Status badge", () => {
    it("should display correct status for pending request", () => {
      render(
        <WorkflowDetailPanel
          request={mockPendingRequest}
          role="employee"
          onApprove={() => {}}
          onReject={() => {}}
          onCancel={() => {}}
          onEdit={() => {}}
        />
      );

      expect(screen.getByText("申請ID: R1")).toBeInTheDocument();
    });

    it("should display unread badge for unread request", () => {
      render(
        <WorkflowDetailPanel
          request={mockPendingRequest}
          role="admin"
          onApprove={() => {}}
          onReject={() => {}}
          onCancel={() => {}}
          onEdit={() => {}}
        />
      );

      expect(screen.getByText("未読")).toBeInTheDocument();
    });
  });
});
