import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  Keyboard,
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
import { Label } from "@/components/ui/label";
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
  { value: "PENDING", label: "保留" },
  { value: "APPROVED", label: "承認済み" },
  { value: "REJECTED", label: "却下" },
  { value: "CANCELLED", label: "取消" },
];

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
          onNextPage={() => filterState.setPage(filters.page + 1)}
          onPrevPage={() => filterState.setPage(Math.max(0, filters.page - 1))}
          onSearch={filterState.setSearch}
          onSelectRequest={handleSelectRequest}
          onSortChange={filterState.setSort}
          onStatusChange={handleTableFilter}
          requests={requests}
          selectedId={selectedRequest?.id ?? null}
        />
        <WorkflowDetailPanel
          onCancel={(id) => setCancelRequestId(id)}
          request={selectedRequest}
        />
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
  onNextPage: () => void;
  onPrevPage: () => void;
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
  onNextPage,
  onPrevPage,
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
            <TabsTrigger className="px-2 text-xs" value="ALL">
              全て
              <Badge className="ml-1 text-xs" variant="secondary">
                {statusCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger className="px-2 text-xs" value="NEW">
              新規
              {statusCounts.new > 0 && (
                <Badge className="ml-1 bg-blue-100 text-xs" variant="secondary">
                  {statusCounts.new}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger className="px-2 text-xs" value="PENDING">
              保留
              {statusCounts.pending > 0 && (
                <Badge className="ml-1 bg-yellow-500 text-xs">
                  {statusCounts.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger className="px-2 text-xs" value="APPROVED">
              承認
              {statusCounts.approved > 0 && (
                <Badge className="ml-1 text-xs" variant="secondary">
                  {statusCounts.approved}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger className="px-2 text-xs" value="REJECTED">
              却下
              {statusCounts.rejected > 0 && (
                <Badge className="ml-1 text-xs" variant="secondary">
                  {statusCounts.rejected}
                </Badge>
              )}
            </TabsTrigger>
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
      <div className="flex flex-1 items-center justify-center rounded-xl border bg-card shadow-sm">
        <p className="text-muted-foreground">
          申請を選択すると詳細が表示されます。
        </p>
      </div>
    );
  }

  const canCancel = request.status === "PENDING";

  return (
    <div className="flex flex-1 flex-col rounded-xl border bg-card shadow-sm">
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs">
              REQUEST #{request.id}
            </p>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-2xl">{request.dateLabel}</h2>
              <RequestStatusBadge ariaHidden status={request.status} />
            </div>
          </div>
          {request.employeeName ? (
            <Badge variant="secondary">{request.employeeName}</Badge>
          ) : null}
        </div>
      </div>

      <div className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-2">
          <InfoCell label="提出日時" value={request.submittedAt} />
          <InfoCell
            label="希望勤務時間"
            value={`${request.requestedInTime ?? "--"} 〜 ${request.requestedOutTime ?? "--"}`}
          />
          <InfoCell
            label="休憩"
            value={`${request.requestedBreakStartTime ?? "--"} 〜 ${request.requestedBreakEndTime ?? "--"}`}
          />
          <InfoCell label="ステータス" value={request.status} />
        </section>

        <section>
          <h3 className="font-semibold text-muted-foreground text-sm">
            申請理由
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm">{request.reason}</p>
        </section>

        {request.rejectionReason ? (
          <section className="rounded-lg bg-rose-50 p-4 text-rose-900 text-sm">
            <h3 className="font-semibold text-xs uppercase tracking-wide">
              却下理由
            </h3>
            <p className="mt-2 whitespace-pre-wrap">
              {request.rejectionReason}
            </p>
          </section>
        ) : null}

        {canCancel ? (
          <div className="flex justify-end">
            <Button onClick={() => onCancel(request.id)} variant="destructive">
              申請を取り消す
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const InfoCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border p-4">
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="mt-1 font-semibold text-lg">{value || "-"}</p>
  </div>
);

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

const obfuscateReason = (text: string, isActive: boolean): string => {
  if (!isActive) {
    return text;
  }
  return text
    .split("")
    .map((char, index) => (index === 0 ? char : `\u200b${char}`))
    .join("");
};
