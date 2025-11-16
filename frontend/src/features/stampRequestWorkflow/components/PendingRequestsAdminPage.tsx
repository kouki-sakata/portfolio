import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  CheckCircle,
  CheckSquare,
  Clock,
  Keyboard,
  MessageSquare,
  Plus,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ApprovalDialog } from "@/features/stampRequestWorkflow/components/ApprovalDialog";
import { RejectionDialog } from "@/features/stampRequestWorkflow/components/RejectionDialog";
import { RequestStatusBadge } from "@/features/stampRequestWorkflow/components/RequestStatusBadge";
import {
  useBulkApproveRequestsMutation,
  usePendingStampRequestsQuery,
} from "@/features/stampRequestWorkflow/hooks/useStampRequests";
import type { StampRequestListItem } from "@/features/stampRequestWorkflow/types";

const STATUS_TABS = [
  { value: "ALL", label: "全て" },
  { value: "NEW", label: "新規" },
  { value: "PENDING", label: "保留" },
  { value: "APPROVED", label: "承認" },
  { value: "REJECTED", label: "却下" },
] as const;

const PENDING_SKELETON_IDS = [
  "pending-skeleton-1",
  "pending-skeleton-2",
  "pending-skeleton-3",
] as const;

type PendingRequestsAdminPageProps = {
  onViewChange?: (view: "employee" | "admin") => void;
  currentView?: "employee" | "admin";
};

export const PendingRequestsAdminPage = ({
  onViewChange,
  currentView = "admin",
}: PendingRequestsAdminPageProps) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: "ALL",
    search: "",
    sort: "recent",
  });
  const { data, isLoading } = usePendingStampRequestsQuery({
    status: filters.status,
    page: 0,
    pageSize: 50,
  });
  const requests = data?.requests ?? [];

  // フィルタリング
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      filters.search === "" ||
      req.employeeName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      req.id.toString().includes(filters.search) ||
      req.reason.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  // ソート
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    switch (filters.sort) {
      case "recent":
        return (
          new Date(b.submittedAt || 0).getTime() -
          new Date(a.submittedAt || 0).getTime()
        );
      case "oldest":
        return (
          new Date(a.submittedAt || 0).getTime() -
          new Date(b.submittedAt || 0).getTime()
        );
      case "status":
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
      default:
        return 0;
    }
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedRequest, setSelectedRequest] =
    useState<StampRequestListItem | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);

  const bulkApproveMutation = useBulkApproveRequestsMutation();

  useEffect(() => {
    if (selectedRequest) {
      return;
    }
    const firstRequest = sortedRequests[0];
    if (firstRequest) {
      setSelectedRequest(firstRequest);
    }
  }, [selectedRequest, sortedRequests]);

  const toggleSelection = (id: number) => {
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

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedRequests.map((r) => r.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      return;
    }
    await bulkApproveMutation.mutateAsync({
      requestIds: Array.from(selectedIds),
    });
    setSelectedIds(new Set());
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) {
      return;
    }
    // TODO: バルク却下ダイアログを実装
    setSelectedIds(new Set());
  };

  const statusCounts = {
    all: requests.length,
    new: requests.filter((r) => r.status === "NEW").length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case "recent":
        return "新しい順";
      case "oldest":
        return "古い順";
      case "status":
        return "ステータス順";
      default:
        return "新しい順";
    }
  };

  const getStatusCount = (status: string) => {
    switch (status) {
      case "ALL":
        return statusCounts.all;
      case "NEW":
        return statusCounts.new;
      case "PENDING":
        return statusCounts.pending;
      case "APPROVED":
        return statusCounts.approved;
      case "REJECTED":
        return statusCounts.rejected;
      default:
        return 0;
    }
  };

  const renderTabBadge = (status: string, count: number) => {
    if (status === "ALL") {
      return (
        <Badge className="ml-1 text-xs" variant="secondary">
          {count}
        </Badge>
      );
    }

    if (count === 0) {
      return null;
    }

    if (status === "NEW") {
      return (
        <Badge className="ml-1 bg-blue-100 text-xs" variant="secondary">
          {count}
        </Badge>
      );
    }

    if (status === "PENDING") {
      return <Badge className="ml-1 bg-yellow-500 text-xs">{count}</Badge>;
    }

    return (
      <Badge className="ml-1 text-xs" variant="secondary">
        {count}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "NEW":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <section className="flex h-screen flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="flex-shrink-0 border-b bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl">勤怠ワークフロー</h1>
              {onViewChange ? (
                <>
                  <Separator className="h-8" orientation="vertical" />
                  <Button
                    onClick={() => onViewChange("employee")}
                    size="sm"
                    variant={currentView === "employee" ? "default" : "ghost"}
                  >
                    従業員
                  </Button>
                  <Button
                    onClick={() => onViewChange("admin")}
                    size="sm"
                    variant={currentView === "admin" ? "default" : "ghost"}
                  >
                    管理者
                  </Button>
                </>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <Button className="gap-2" size="sm" variant="outline">
                <Keyboard className="h-4 w-4" />
                <span className="hidden sm:inline">コマンド</span>
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新規申請
              </Button>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm">
                  {user ? `${user.lastName} ${user.firstName}` : "管理者"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左サイドバー: リスト */}
        <div className="flex w-96 flex-col border-r bg-white">
          {/* 検索 & フィルター */}
          <div className="space-y-3 border-b p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9"
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="申請を検索..."
                value={filters.search}
              />
            </div>

            {/* ステータスタブ */}
            <Tabs
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
              value={filters.status}
            >
              <TabsList className="grid w-full grid-cols-5">
                {STATUS_TABS.map((tab) => {
                  const count = getStatusCount(tab.value);
                  return (
                    <TabsTrigger
                      className="px-2 text-xs"
                      key={tab.value}
                      value={tab.value}
                    >
                      {tab.label}
                      {renderTabBadge(tab.value, count)}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {/* ソート & バルクアクション */}
            <div className="flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2" size="sm" variant="outline">
                    <ArrowUpDown className="h-3 w-3" />
                    {getSortLabel(filters.sort)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>並び替え</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    onValueChange={(v) =>
                      setFilters((prev) => ({ ...prev, sort: v }))
                    }
                    value={filters.sort}
                  >
                    <DropdownMenuRadioItem value="recent">
                      新しい順
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="oldest">
                      古い順
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="status">
                      ステータス順
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-2">
                <Button
                  className="h-8 px-2"
                  onClick={toggleSelectAll}
                  size="sm"
                  variant="ghost"
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
                {selectedIds.size > 0 && (
                  <Badge variant="secondary">{selectedIds.size}件選択</Badge>
                )}
              </div>
            </div>
          </div>

          {/* バルクアクションバー */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between border-b bg-primary/10 px-4 py-3">
              <span className="text-sm">{selectedIds.size}件を選択中</span>
              <div className="flex gap-2">
                <Button
                  className="bg-green-50 text-green-700 hover:bg-green-100"
                  onClick={handleBulkApprove}
                  size="sm"
                  variant="outline"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  承認
                </Button>
                <Button
                  className="bg-red-50 text-red-700 hover:bg-red-100"
                  onClick={handleBulkReject}
                  size="sm"
                  variant="outline"
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  却下
                </Button>
              </div>
            </div>
          )}

          {/* リスト */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {isLoading ? (
                PENDING_SKELETON_IDS.map((id) => (
                  <Skeleton className="mb-2 h-24 w-full" key={id} />
                ))
              ) : sortedRequests.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <AlertCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <p>申請が見つかりません</p>
                </div>
              ) : (
                sortedRequests.map((request) => (
                  <div
                    className={`group relative mb-2 rounded-lg border transition-all ${
                      selectedRequest?.id === request.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    key={request.id}
                  >
                    <div className="flex items-start gap-3 p-4">
                      {/* チェックボックス */}
                      <Checkbox
                        checked={selectedIds.has(request.id)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleSelection(request.id)}
                      />

                      {/* メインコンテンツ */}
                      <button
                        className="flex-1 text-left"
                        onClick={() => setSelectedRequest(request)}
                        type="button"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <span className="text-gray-500 text-xs">
                              R{request.id}
                            </span>
                            {request.unread && (
                              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                            )}
                          </div>
                          <RequestStatusBadge status={request.status} />
                        </div>
                        <div className="mb-2">
                          <div className="mb-1 flex items-center gap-2">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {request.employeeName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{request.dateLabel}</span>
                            <span className="text-gray-500 text-xs">
                              打刻修正
                            </span>
                          </div>
                        </div>
                        <p className="mb-2 line-clamp-2 text-gray-600 text-sm">
                          {request.reason}
                        </p>
                        <div className="text-gray-400 text-xs">
                          提出: {request.submittedAt || "N/A"}
                        </div>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 右メインエリア: 詳細パネル */}
        <div className="flex-1 bg-gray-50">
          {selectedRequest ? (
            <ScrollArea className="h-full">
              <div className="mx-auto max-w-3xl p-8 animate-in fade-in slide-in-from-right-5 duration-300">
                {/* ヘッダー */}
                <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <h2 className="text-2xl">申請詳細</h2>
                        <RequestStatusBadge status={selectedRequest.status} />
                      </div>
                      <p className="text-gray-600">
                        申請ID: R{selectedRequest.id}
                      </p>
                    </div>
                    {selectedRequest.unread && (
                      <Badge className="animate-pulse" variant="destructive">
                        未読
                      </Badge>
                    )}
                  </div>

                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                    <User className="h-4 w-4 text-gray-600" />
                    <span>申請者: {selectedRequest.employeeName}</span>
                  </div>

                  {/* 基本情報 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-1 text-gray-600 text-sm">対象日</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{selectedRequest.dateLabel}</span>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-gray-600 text-sm">
                        修正種別
                      </div>
                      <div>打刻修正</div>
                    </div>
                    <div>
                      <div className="mb-1 text-gray-600 text-sm">
                        勤務時間
                      </div>
                      <div>
                        {selectedRequest.requestedInTime || "--"} 〜{" "}
                        {selectedRequest.requestedOutTime || "--"}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-gray-600 text-sm">
                        提出日時
                      </div>
                      <div className="text-sm">
                        {selectedRequest.submittedAt}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 申請理由 */}
                <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                    <h3>申請理由</h3>
                  </div>
                  <p className="leading-relaxed text-gray-700">
                    {selectedRequest.reason}
                  </p>
                </div>

                {/* 却下理由（却下の場合のみ） */}
                {selectedRequest.status === "REJECTED" &&
                  selectedRequest.rejectionReason && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <h3 className="text-red-900">却下理由</h3>
                      </div>
                      <p className="leading-relaxed text-red-800">
                        {selectedRequest.rejectionReason}
                      </p>
                    </div>
                  )}

                {/* アクションボタン */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <h3 className="mb-4">アクション</h3>
                  <div className="space-y-3">
                    {(selectedRequest.status === "PENDING" ||
                      selectedRequest.status === "NEW") && (
                      <>
                        <Button
                          className="w-full justify-start bg-green-600 hover:bg-green-700"
                          onClick={() => setApprovalDialogOpen(true)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          承認する
                        </Button>
                        <Button
                          className="w-full justify-start border-red-200 text-red-600 hover:text-red-700"
                          onClick={() => setRejectionDialogOpen(true)}
                          variant="outline"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          却下する
                        </Button>
                      </>
                    )}
                    {selectedRequest.status === "APPROVED" && (
                      <p className="rounded-lg bg-green-50 p-4 text-gray-600 text-sm">
                        ✓ この申請は承認済みです
                      </p>
                    )}
                    {selectedRequest.status === "REJECTED" && (
                      <p className="rounded-lg bg-red-50 p-4 text-gray-600 text-sm">
                        ✗ この申請は却下済みです
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="mb-2 text-lg">申請を選択してください</p>
                <p className="text-gray-500 text-sm">
                  ↑↓キーで移動、Enterキーで選択できます
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

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
    </section>
  );
};
