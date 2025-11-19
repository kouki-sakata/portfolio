import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  CheckCircle,
  CheckSquare,
  Clock,
  Search,
  User,
  XCircle,
} from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSubmittedAt } from "@/features/stampHistory/lib/dateUtils";
import { RequestStatusBadge } from "@/features/stampRequestWorkflow/components/RequestStatusBadge";
import type { StampRequestListItem } from "@/features/stampRequestWorkflow/types";

const STATUS_TABS = [
  { value: "ALL", label: "全て" },
  { value: "NEW", label: "新規" },
  { value: "PENDING", label: "保留" },
  { value: "APPROVED", label: "承認" },
  { value: "REJECTED", label: "却下" },
] as const;

const SKELETON_IDS = [
  "sidebar-skeleton-1",
  "sidebar-skeleton-2",
  "sidebar-skeleton-3",
] as const;

type WorkflowSidebarProps = {
  role: "employee" | "admin";
  requests: StampRequestListItem[];
  selectedId: number | null;
  isLoading: boolean;
  statusFilter: string;
  searchQuery: string;
  sortBy: string;
  selectedIds?: Set<number>;
  onSelectRequest: (id: number) => void;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  onToggleSelection?: (id: number) => void;
  onToggleSelectAll?: () => void;
};

export const WorkflowSidebar = ({
  role,
  requests,
  selectedId,
  isLoading,
  statusFilter,
  searchQuery,
  sortBy,
  selectedIds,
  onSelectRequest,
  onStatusChange,
  onSearchChange,
  onSortChange,
  onToggleSelection,
  onToggleSelectAll,
}: WorkflowSidebarProps) => {
  const isAdmin = role === "admin";

  // ステータスカウントを計算
  const statusCounts = {
    all: requests.length,
    new: requests.filter((r) => r.status === "NEW").length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
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

  const renderRequestList = () => {
    if (isLoading) {
      return SKELETON_IDS.map((id) => (
        <Skeleton className="mb-2 h-24 w-full" key={id} />
      ));
    }

    if (requests.length === 0) {
      return (
        <div className="py-12 text-center text-gray-500">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p>申請が見つかりません</p>
        </div>
      );
    }

    return requests.map((request) => (
      <div
        className={`group relative mb-2 rounded-lg border transition-all ${
          selectedId === request.id
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "bg-white hover:border-gray-300 hover:bg-gray-50"
        }`}
        key={request.id}
      >
        <div className="flex items-start gap-3 p-4">
          {/* チェックボックス（管理者のみ） */}
          {isAdmin && onToggleSelection && (
            <Checkbox
              checked={selectedIds?.has(request.id)}
              className="mt-1"
              onCheckedChange={() => onToggleSelection(request.id)}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* メインコンテンツ */}
          <button
            className="flex-1 text-left"
            onClick={() => onSelectRequest(request.id)}
            type="button"
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(request.status)}
                <span className="text-gray-500 text-xs">R{request.id}</span>
                {request.unread && (
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                )}
              </div>
              <RequestStatusBadge status={request.status} />
            </div>
            <div className="mb-2">
              {/* 管理者ビュー: 従業員名表示 */}
              {isAdmin && request.employeeName && (
                <div className="mb-1 flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-sm">{request.employeeName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-sm">{request.dateLabel}</span>
                <span className="text-gray-500 text-xs">打刻修正</span>
              </div>
            </div>
            <p className="mb-2 line-clamp-2 text-gray-600 text-sm">
              {request.reason}
            </p>
            <div className="text-gray-400 text-xs">
              提出: {formatSubmittedAt(request.createdAt) || "N/A"}
            </div>
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="flex w-96 flex-col border-r bg-white">
      {/* 検索 & フィルター */}
      <div className="space-y-3 border-b p-4">
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="申請を検索..."
            value={searchQuery}
          />
        </div>

        {/* ステータスタブ */}
        <Tabs onValueChange={onStatusChange} value={statusFilter}>
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
                {getSortLabel(sortBy)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>並び替え</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                onValueChange={onSortChange}
                value={sortBy}
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

          {isAdmin && onToggleSelectAll && (
            <div className="flex items-center gap-2">
              <Button
                className="h-8 px-2"
                onClick={onToggleSelectAll}
                size="sm"
                variant="ghost"
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
              {selectedIds && selectedIds.size > 0 && (
                <Badge variant="secondary">{selectedIds.size}件選択</Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* リスト */}
      <ScrollArea className="flex-1">
        <div className="p-2">{renderRequestList()}</div>
      </ScrollArea>
    </div>
  );
};
