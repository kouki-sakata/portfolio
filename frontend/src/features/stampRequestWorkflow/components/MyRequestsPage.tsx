import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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

export const MyRequestsPage = () => {
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
    <section className="space-y-6 py-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">STAMP REQUESTS</p>
          <h1 className="font-bold text-3xl">勤怠ワークフロー</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <fieldset className="inline-flex rounded-full border p-1">
            <legend className="sr-only">ビュー切替</legend>
            <Button aria-pressed={true} size="sm" variant="secondary">
              従業員ビュー
            </Button>
            <Button aria-pressed={false} size="sm" variant="ghost">
              管理者ビュー
            </Button>
          </fieldset>
          <Button
            aria-label="⌘K コマンド"
            onClick={() => setCommandOpen(true)}
            size="sm"
            variant="outline"
          >
            ⌘K コマンド
          </Button>
          <Button aria-label="新しい申請" size="sm">
            新しい申請
          </Button>
          <Badge variant="outline">
            {user ? `${user.lastName} ${user.firstName}` : "ゲスト"}
          </Badge>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
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
      return (
        <button
          aria-pressed={selectedId === request.id}
          className="w-full rounded-lg border p-3 text-left transition hover:bg-muted"
          key={request.id}
          onClick={() => onSelectRequest(request.id)}
          type="button"
        >
          <div className="flex items-center justify-between">
            <RequestStatusBadge status={request.status} />
            {request.unread ? (
              <span aria-label="未読リクエスト" className="inline-flex items-center">
                <span className="sr-only">未読リクエスト</span>
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-red-500"
                />
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-muted-foreground text-sm">
            {obfuscateReason(request.reason, isActive)}
          </p>
          <div className="mt-3 flex items-center justify-between text-muted-foreground text-xs">
            <span>{request.dateLabel}</span>
            <span>↑↓で移動・Enterで開く</span>
          </div>
        </button>
      );
    });
  };

  return (
    <aside
      className="w-full rounded-xl border bg-card shadow-sm lg:w-[384px]"
      data-testid="workflow-sidebar"
    >
      <div className="border-b p-4">
        <div className="flex items-center rounded-full border px-3">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Label className="sr-only" htmlFor="workflow-search">
            検索
          </Label>
          <Input
            aria-label="検索"
            className="border-0 p-0 shadow-none focus-visible:ring-0"
            id="workflow-search"
            onChange={(event) => onSearch(event.target.value)}
            placeholder="検索"
            value={filters.search}
          />
        </div>
        <div
          aria-label="ステータスタブ"
          className="mt-4 flex space-x-1 overflow-x-auto"
          role="tablist"
        >
          {STATUS_TABS.map((tab) => (
            <Button
              aria-controls={`tab-${tab.value}`}
              aria-selected={filters.status === tab.value}
              key={tab.value}
              onClick={() => onStatusChange(tab.value)}
              role="tab"
              size="sm"
              variant={filters.status === tab.value ? "secondary" : "ghost"}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <Select
          onValueChange={(value) => onSortChange(value)}
          value={filters.sort}
        >
          <SelectTrigger className="mt-4">
            <SelectValue placeholder="並び順" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">新しい順</SelectItem>
            <SelectItem value="oldest">古い順</SelectItem>
            <SelectItem value="status">ステータス順</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="max-h-[520px] overflow-y-auto">
        <div className="space-y-2 p-4">{renderRequestList()}</div>
      </div>

      <div className="flex items-center justify-between border-t p-4">
        <Button
          aria-label="前のページ"
          disabled={filters.page === 0}
          onClick={onPrevPage}
          size="sm"
          variant="ghost"
        >
          前のページ
        </Button>
        <Button
          aria-label="次のページ"
          onClick={onNextPage}
          size="sm"
          variant="ghost"
        >
          次のページ
        </Button>
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
