import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { ApprovalDialog } from "@/features/stampRequestWorkflow/components/ApprovalDialog";
import { BulkActionBar } from "@/features/stampRequestWorkflow/components/BulkActionBar";
import { CancellationDialog } from "@/features/stampRequestWorkflow/components/CancellationDialog";
import { RejectionDialog } from "@/features/stampRequestWorkflow/components/RejectionDialog";
import { WorkflowDetailPanel } from "@/features/stampRequestWorkflow/components/WorkflowDetailPanel";
import { WorkflowHeader } from "@/features/stampRequestWorkflow/components/WorkflowHeader";
import { WorkflowSidebar } from "@/features/stampRequestWorkflow/components/WorkflowSidebar";
import {
  useBulkApproveRequestsMutation,
  useMyStampRequestsQuery,
  usePendingStampRequestsQuery,
} from "@/features/stampRequestWorkflow/hooks/useStampRequests";
import { useWorkflowFilters } from "@/features/stampRequestWorkflow/hooks/useWorkflowFilters";
import type { StampRequestListItem } from "@/features/stampRequestWorkflow/types";
import { toast } from "@/hooks/use-toast";

type StampRequestWorkflowPageProps = {
  role: "employee" | "admin";
  onViewChange?: (view: "employee" | "admin") => void;
  showViewSwitcher?: boolean;
};

export const StampRequestWorkflowPage = ({
  role,
  onViewChange,
  showViewSwitcher = false,
}: StampRequestWorkflowPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  // ユーザー表示名を取得
  const getUserDisplayName = () => {
    if (user) {
      return `${user.lastName} ${user.firstName}`;
    }
    if (isAdmin) {
      return "管理者";
    }
    return;
  };

  // フィルター状態
  const employeeFilters = useWorkflowFilters();
  const [adminFilters, setAdminFilters] = useState({
    status: "ALL",
    search: "",
    sort: "recent",
  });

  // データ取得
  const employeeQuery = useMyStampRequestsQuery(
    employeeFilters.filters,
    !isAdmin
  );
  const adminQuery = usePendingStampRequestsQuery(
    {
      status: adminFilters.status,
      page: 0,
      pageSize: 50,
    },
    isAdmin
  );

  const { data: employeeData, isLoading: employeeLoading } = employeeQuery;
  const { data: adminData, isLoading: adminLoading } = adminQuery;

  // データとローディング状態を切り替え
  const requests = isAdmin
    ? (adminData?.requests ?? [])
    : (employeeData?.requests ?? []);
  const isLoading = isAdmin ? adminLoading : employeeLoading;

  // フィルタリングとソート（管理者ビューのみクライアント側）
  const filteredAndSortedRequests = useMemo(
    () => (isAdmin ? filterAndSortRequests(requests, adminFilters) : requests),
    [isAdmin, requests, adminFilters]
  );

  // 選択状態
  const [selectedRequest, setSelectedRequest] =
    useState<StampRequestListItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ダイアログ状態
  const [cancelRequestId, setCancelRequestId] = useState<number | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);

  // ミューテーション
  const bulkApproveMutation = useBulkApproveRequestsMutation();

  // 選択中のリクエストを最新のリストと同期
  useEffect(() => {
    if (!selectedRequest) {
      return;
    }

    const found = filteredAndSortedRequests.find(
      (r) => r.id === selectedRequest.id
    );

    if (found) {
      // 内容が更新されている場合のみセット（参照比較）
      if (found !== selectedRequest) {
        setSelectedRequest(found);
      }
    } else {
      // リストから消えた場合（フィルタリングなど）は選択解除
      setSelectedRequest(null);
    }
  }, [filteredAndSortedRequests, selectedRequest]);

  // 最初のリクエストを自動選択
  useEffect(() => {
    if (selectedRequest) {
      return;
    }
    const firstRequest = filteredAndSortedRequests[0];
    if (firstRequest) {
      setSelectedRequest(firstRequest);
    }
  }, [selectedRequest, filteredAndSortedRequests]);

  // ハンドラー
  const handleSelectRequest = (id: number) => {
    const request = filteredAndSortedRequests.find((r) => r.id === id);
    if (request) {
      setSelectedRequest(request);
    }
  };

  const handleToggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedRequests.map((r) => r.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0 || bulkApproveMutation.isPending) {
      return;
    }
    try {
      await bulkApproveMutation.mutateAsync({
        requestIds: Array.from(selectedIds),
      });
      setSelectedIds(new Set());
    } catch {
      // mutation's onError handles user feedback
    }
  };

  const handleBulkReject = () => {
    toast({
      title: "未実装の機能",
      description: "一括却下は未対応です",
      variant: "default",
    });
  };

  const handleStatusChange = (status: string) => {
    if (isAdmin) {
      setAdminFilters((prev) => ({ ...prev, status }));
    } else {
      employeeFilters.setStatus(status);
    }
    setSelectedRequest(null);
  };

  const handleSearchChange = (search: string) => {
    if (isAdmin) {
      setAdminFilters((prev) => ({ ...prev, search }));
    } else {
      employeeFilters.setSearch(search);
    }
  };

  const handleSortChange = (sort: string) => {
    if (isAdmin) {
      setAdminFilters((prev) => ({ ...prev, sort }));
    } else {
      employeeFilters.setSort(sort);
    }
  };

  const currentFilters = isAdmin
    ? adminFilters
    : {
        status: employeeFilters.filters.status,
        search: employeeFilters.filters.search,
        sort: employeeFilters.filters.sort,
      };

  const handleNewRequestClick = () => {
    navigate("/stamp-history");
  };

  return (
    <section className="flex h-screen flex-col bg-gray-50">
      <WorkflowHeader
        onNewRequestClick={handleNewRequestClick}
        onViewChange={onViewChange}
        role={role}
        showViewSwitcher={showViewSwitcher}
        userName={getUserDisplayName()}
      />

      <div className="flex flex-1 overflow-hidden">
        {isAdmin && selectedIds.size > 0 && (
          <div className="absolute top-[73px] right-0 left-96 z-10">
            <BulkActionBar
              isApproving={bulkApproveMutation.isPending}
              onApprove={handleBulkApprove}
              onReject={handleBulkReject}
              selectedCount={selectedIds.size}
            />
          </div>
        )}

        <WorkflowSidebar
          isLoading={isLoading}
          onSearchChange={handleSearchChange}
          onSelectRequest={handleSelectRequest}
          onSortChange={handleSortChange}
          onStatusChange={handleStatusChange}
          onToggleSelectAll={isAdmin ? handleToggleSelectAll : undefined}
          onToggleSelection={isAdmin ? handleToggleSelection : undefined}
          requests={filteredAndSortedRequests}
          searchQuery={currentFilters.search}
          selectedId={selectedRequest?.id ?? null}
          selectedIds={isAdmin ? selectedIds : undefined}
          sortBy={currentFilters.sort}
          statusFilter={currentFilters.status}
          userRole={role}
        />

        <div className="flex-1 bg-gray-50">
          <WorkflowDetailPanel
            onApprove={() => setApprovalDialogOpen(true)}
            onCancel={(id) => setCancelRequestId(id)}
            onEdit={undefined}
            onReject={() => setRejectionDialogOpen(true)}
            request={selectedRequest}
            userRole={role}
          />
        </div>
      </div>

      {/* ダイアログ */}
      {cancelRequestId && (
        <CancellationDialog
          onOpenChange={(open) => {
            if (!open) {
              setCancelRequestId(null);
            }
          }}
          open={cancelRequestId !== null}
          requestId={cancelRequestId}
        />
      )}

      {isAdmin && (
        <>
          <ApprovalDialog
            onOpenChange={setApprovalDialogOpen}
            open={approvalDialogOpen}
            request={selectedRequest}
          />
          <RejectionDialog
            onOpenChange={setRejectionDialogOpen}
            open={rejectionDialogOpen}
            request={selectedRequest}
          />
        </>
      )}
    </section>
  );
};

// ヘルパー関数: クライアント側フィルタリングとソート
function filterAndSortRequests(
  requests: StampRequestListItem[],
  filters: { status: string; search: string; sort: string }
): StampRequestListItem[] {
  // フィルタリング
  const filtered = requests.filter((req) => {
    const matchesSearch =
      filters.search === "" ||
      req.employeeName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      req.id.toString().includes(filters.search) ||
      req.reason.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  // ソート
  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case "recent":
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
        );
      case "status": {
        const statusOrder = {
          NEW: 0,
          PENDING: 1,
          REJECTED: 2,
          APPROVED: 3,
          CANCELLED: 4,
        };
        return (
          (statusOrder[a.status as keyof typeof statusOrder] ?? 999) -
          (statusOrder[b.status as keyof typeof statusOrder] ?? 999)
        );
      }
      default:
        return 0;
    }
  });

  return sorted;
}
