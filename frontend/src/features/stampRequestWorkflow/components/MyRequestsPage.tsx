import {
  AlertCircle,
  ArrowUpDown,
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Keyboard,
  MessageSquare,
  Plus,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { CancellationDialog } from "@/features/stampRequestWorkflow/components/CancellationDialog";
import { RequestStatusBadge } from "@/features/stampRequestWorkflow/components/RequestStatusBadge";
import {
  type MyRequestFilters,
  useMyStampRequestsQuery,
} from "@/features/stampRequestWorkflow/hooks/useStampRequests";
import { useWorkflowFilters } from "@/features/stampRequestWorkflow/hooks/useWorkflowFilters";
import type { StampRequestListItem } from "@/features/stampRequestWorkflow/types";

const STATUS_TABS = [
  { value: "ALL", label: "全て" },
  { value: "NEW", label: "新規" },
  { value: "PENDING", label: "保留" },
  { value: "APPROVED", label: "承認" },
  { value: "REJECTED", label: "却下" },
] as const;

const SIDEBAR_SKELETON_IDS = [
  "sidebar-skeleton-1",
  "sidebar-skeleton-2",
  "sidebar-skeleton-3",
] as const;

type MyRequestsPageProps = {
  onViewChange?: (view: "employee" | "admin") => void;
  currentView?: "employee" | "admin";
  showViewSwitcher?: boolean;
};

export const MyRequestsPage = ({
  onViewChange,
  currentView = "employee",
  showViewSwitcher = false,
}: MyRequestsPageProps) => {
  const { user } = useAuth();
  const filterState = useWorkflowFilters();
  const { filters } = filterState;
  const { data, isLoading } = useMyStampRequestsQuery(filters);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCommandOpen, setCommandOpen] = useState(false);
  const [cancelRequestId, setCancelRequestId] = useState<number | null>(null);

  const requests = data?.requests ?? [];

  const selectedRequest = useMemo(() => {
    if (selectedId === null) {
      return requests[0] ?? null;
    }
    return requests.find((req) => req.id === selectedId) ?? null;
  }, [requests, selectedId]);

  const handleSelectRequest = (id: number) => {
    setSelectedId(id);
  };

  const handleTableFilter = (status: string) => {
    filterState.setStatus(status);
    setSelectedId(null);
  };

  return (
    <section className="flex h-screen flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="flex-shrink-0 border-b bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl">勤怠ワークフロー</h1>
              {showViewSwitcher && onViewChange ? (
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
              <Button
                className="gap-2"
                onClick={() => setCommandOpen(true)}
                size="sm"
                variant="outline"
              >
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
                  {user ? `${user.lastName} ${user.firstName}` : "ゲスト"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        <WorkflowSidebar
          filters={filters}
          isLoading={isLoading}
          onSearch={filterState.setSearch}
          onSelectRequest={handleSelectRequest}
          onSortChange={filterState.setSort}
          onStatusChange={handleTableFilter}
          requests={requests}
          selectedId={selectedRequest?.id ?? null}
        />
        <div className="flex-1 bg-gray-50">
          <WorkflowDetailPanel
            onCancel={(id) => setCancelRequestId(id)}
            request={selectedRequest}
          />
        </div>
      </div>

      <WorkflowCommandPalette
        onFilterSelect={handleTableFilter}
        onOpenChange={setCommandOpen}
        open={isCommandOpen}
      />

      {cancelRequestId ? (
        <CancellationDialog
          onOpenChange={(open) => {
            if (!open) {
              setCancelRequestId(null);
            }
          }}
          open={cancelRequestId !== null}
          requestId={cancelRequestId}
        />
      ) : null}
    </section>
  );
};

type WorkflowSidebarProps = {
  requests: StampRequestListItem[];
  selectedId: number | null;
  onSelectRequest: (id: number) => void;
  filters: MyRequestFilters;
  onStatusChange: (status: string) => void;
  onSearch: (term: string) => void;
  onSortChange: (value: string) => void;
  isLoading: boolean;
};

const WorkflowSidebar = ({
  requests,
  selectedId,
  onSelectRequest,
  filters,
  onStatusChange,
  onSearch,
  onSortChange,
  isLoading,
}: WorkflowSidebarProps) => {
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

  const renderRequestList = () => {
    if (isLoading) {
      return SIDEBAR_SKELETON_IDS.map((id) => (
        <Skeleton className="h-24 w-full" key={id} />
      ));
    }

    if (requests.length === 0) {
      return (
        <p className="text-center text-muted-foreground text-sm">
          該当する申請がありません。
        </p>
      );
    }

    return requests.map((request) => {
      const isActive = selectedId === request.id;
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
        <div
          className={`group relative mb-2 rounded-lg border transition-all ${
            isActive
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : "bg-white hover:border-gray-300 hover:bg-gray-50"
          }`}
          key={request.id}
        >
          <div className="flex items-start gap-3 p-4">
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
                提出: {request.submittedAt || "N/A"}
              </div>
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <aside
      className="flex w-96 flex-col border-r bg-white"
      data-testid="workflow-sidebar"
    >
      <div className="space-y-3 border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9"
            onChange={(event) => onSearch(event.target.value)}
            placeholder="申請を検索..."
            value={filters.search}
          />
        </div>

        {/* ステータスタブ */}
        <Tabs onValueChange={onStatusChange} value={filters.status}>
          <TabsList className="grid w-full grid-cols-5">
            {STATUS_TABS.map((tab) => {
              const count = getStatusCount(tab.value);
              return (
                <TabsTrigger className="px-2 text-xs" key={tab.value} value={tab.value}>
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
                onValueChange={onSortChange}
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
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2">{renderRequestList()}</div>
      </ScrollArea>

      {/* フッター: ショートカットヒント */}
      <div className="border-t bg-gray-50 p-3">
        <div className="flex items-center justify-center gap-4 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-white px-1.5 py-0.5">↑↓</kbd>
            移動
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-white px-1.5 py-0.5">Enter</kbd>
            選択
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-white px-1.5 py-0.5">⌘K</kbd>
            コマンド
          </span>
        </div>
      </div>
    </aside>
  );
};

type WorkflowDetailPanelProps = {
  request: StampRequestListItem | null;
  onCancel: (id: number) => void;
};

const WorkflowDetailPanel = ({
  request,
  onCancel,
}: WorkflowDetailPanelProps) => {
  if (!request) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="mb-2 text-lg">申請を選択してください</p>
          <p className="text-gray-500 text-sm">
            ↑↓キーで移動、Enterキーで選択できます
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-3xl p-8 animate-in fade-in slide-in-from-right-5 duration-300">
        {/* ヘッダー */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-2xl">申請詳細</h2>
                <RequestStatusBadge status={request.status} />
              </div>
              <p className="text-gray-600">申請ID: R{request.id}</p>
            </div>
            {request.unread && (
              <Badge className="animate-pulse" variant="destructive">
                未読
              </Badge>
            )}
          </div>

          {/* 基本情報 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1 text-gray-600 text-sm">対象日</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{request.dateLabel}</span>
              </div>
            </div>
            <div>
              <div className="mb-1 text-gray-600 text-sm">修正種別</div>
              <div>打刻修正</div>
            </div>
            <div>
              <div className="mb-1 text-gray-600 text-sm">勤務時間</div>
              <div>
                {request.requestedInTime || "--"} 〜{" "}
                {request.requestedOutTime || "--"}
              </div>
            </div>
            <div>
              <div className="mb-1 text-gray-600 text-sm">提出日時</div>
              <div className="text-sm">{request.submittedAt}</div>
            </div>
          </div>
        </div>

        {/* 申請理由 */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h3>申請理由</h3>
          </div>
          <p className="leading-relaxed text-gray-700">{request.reason}</p>
        </div>

        {/* 却下理由（却下の場合のみ） */}
        {request.status === "REJECTED" && request.rejectionReason && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-red-900">却下理由</h3>
            </div>
            <p className="leading-relaxed text-red-800">
              {request.rejectionReason}
            </p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4">アクション</h3>
          <div className="space-y-3">
            {request.status === "PENDING" && (
              <>
                <Button
                  className="w-full justify-start"
                  onClick={() => {}}
                  variant="outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  申請を編集する
                </Button>
                <Button
                  className="w-full justify-start border-red-200 text-red-600 hover:text-red-700"
                  onClick={() => onCancel(request.id)}
                  variant="outline"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  申請をキャンセルする
                </Button>
              </>
            )}
            {request.status === "REJECTED" && (
              <Button
                className="w-full justify-start"
                onClick={() => {}}
              >
                <Edit className="mr-2 h-4 w-4" />
                修正して再申請する
              </Button>
            )}
            {request.status === "APPROVED" && (
              <p className="rounded-lg bg-green-50 p-4 text-gray-600 text-sm">
                ✓ この申請は承認済みです
              </p>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};


type WorkflowCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilterSelect: (status: string) => void;
};

const WorkflowCommandPalette = ({
  open,
  onOpenChange,
  onFilterSelect,
}: WorkflowCommandPaletteProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-card p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">コマンド</h2>
          <Button
            onClick={() => onOpenChange(false)}
            size="icon"
            variant="ghost"
          >
            ×
          </Button>
        </div>
        <div className="space-y-2">
          <CommandItem
            label="新規申請を作成"
            onSelect={() => onOpenChange(false)}
          />
          <CommandItem
            label="保留のみ表示"
            onSelect={() => {
              onFilterSelect("PENDING");
              onOpenChange(false);
            }}
          />
          <CommandItem
            label="承認済みのみ表示"
            onSelect={() => {
              onFilterSelect("APPROVED");
              onOpenChange(false);
            }}
          />
          <CommandItem
            label="設定を開く"
            onSelect={() => onOpenChange(false)}
          />
        </div>
      </div>
    </div>
  );
};

type CommandItemProps = {
  label: string;
  onSelect: () => void;
};

const CommandItem = ({ label, onSelect }: CommandItemProps) => (
  <button
    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
    onClick={onSelect}
    role="menuitem"
    type="button"
  >
    {label}
  </button>
);
