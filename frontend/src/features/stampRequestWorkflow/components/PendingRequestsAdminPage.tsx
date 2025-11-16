import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { Keyboard, Plus, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ApprovalDialog } from "@/features/stampRequestWorkflow/components/ApprovalDialog";
import { BulkActionBar } from "@/features/stampRequestWorkflow/components/BulkActionBar";
import { BulkRejectionDialog } from "@/features/stampRequestWorkflow/components/BulkRejectionDialog";
import { RejectionDialog } from "@/features/stampRequestWorkflow/components/RejectionDialog";
import { RequestStatusBadge } from "@/features/stampRequestWorkflow/components/RequestStatusBadge";
import {
  useBulkApproveRequestsMutation,
  useBulkRejectRequestsMutation,
  usePendingStampRequestsQuery,
} from "@/features/stampRequestWorkflow/hooks/useStampRequests";
import type {
  PendingRequestFilters,
  StampRequestListItem,
} from "@/features/stampRequestWorkflow/types";
import { toast } from "@/hooks/use-toast";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableSelectionCheckbox,
} from "@/shared/components/data-table";

const MAX_BULK_SELECTION = 50;
const PENDING_SKELETON_IDS = [
  "pending-skeleton-1",
  "pending-skeleton-2",
  "pending-skeleton-3",
] as const;
type AdminFilters = PendingRequestFilters & {
  search: string;
  sort: string;
  status: string;
};
const STATUS_TABS = [
  { value: "ALL", label: "全て" },
  { value: "NEW", label: "新規" },
  { value: "PENDING", label: "保留" },
  { value: "APPROVED", label: "承認済み" },
  { value: "REJECTED", label: "却下" },
];

type PendingRequestsAdminPageProps = {
  onViewChange?: (view: "employee" | "admin") => void;
  currentView?: "employee" | "admin";
};

export const PendingRequestsAdminPage = ({
  onViewChange,
  currentView = "admin",
}: PendingRequestsAdminPageProps) => {
  const [filters, setFilters] = useState<AdminFilters>({
    status: "PENDING",
    page: 0,
    pageSize: 20,
    search: "",
    sort: "recent",
  });
  const { data, isLoading } = usePendingStampRequestsQuery(filters);
  const requests = data?.requests ?? [];
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const activeRequest =
    requests.find((req) => req.id === activeRequestId) ?? requests[0] ?? null;
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [bulkRejectionDialogOpen, setBulkRejectionDialogOpen] = useState(false);

  useEffect(() => {
    if (activeRequestId) {
      return;
    }
    const firstRequest = requests[0];
    if (firstRequest) {
      setActiveRequestId(firstRequest.id);
    }
  }, [activeRequestId, requests]);

  const bulkApproveMutation = useBulkApproveRequestsMutation();
  const bulkRejectMutation = useBulkRejectRequestsMutation();

  const columns = useRequestColumns();

  const handleRowSelectionChange = useCallback(
    (selection: RowSelectionState) => {
      const selectionCount = Object.values(selection).filter(Boolean).length;
      if (selectionCount > MAX_BULK_SELECTION) {
        toast({
          title: "選択上限を超えています",
          description: "一度に処理できるのは50件までです。",
          variant: "destructive",
        });
        return;
      }

      const selected = Object.keys(selection)
        .filter((key) => selection[key])
        .map((key) => requests[Number.parseInt(key, 10)]?.id)
        .filter((id): id is number => typeof id === "number");

      setRowSelection(selection);
      setSelectedIds(selected);
    },
    [requests]
  );

  const handleClearSelection = () => {
    setRowSelection({});
    setSelectedIds([]);
  };

  const handleBulkApprove = async () => {
    if (!selectedIds.length) {
      return;
    }
    await bulkApproveMutation.mutateAsync({ requestIds: selectedIds });
    handleClearSelection();
  };

  const handleBulkReject = () => {
    if (!selectedIds.length) {
      return;
    }
    setBulkRejectionDialogOpen(true);
  };

  const detail = activeRequest ? (
    <WorkflowDetailPanel
      onApprove={() => setApprovalDialogOpen(true)}
      onReject={() => setRejectionDialogOpen(true)}
      request={activeRequest}
    />
  ) : (
    <div className="flex flex-1 items-center justify-center rounded-xl border bg-card shadow-sm">
      <p className="text-muted-foreground">
        申請を選択すると詳細が表示されます。
      </p>
    </div>
  );

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
                <span className="text-sm">管理者</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-full rounded-xl border bg-card shadow-sm lg:w-[420px]">
          <div className="space-y-4 border-b p-4">
            <div className="flex items-center rounded-full border px-3">
              <Label className="sr-only" htmlFor="pending-search">
                検索
              </Label>
              <Input
                className="border-0 p-0 shadow-none focus-visible:ring-0"
                id="pending-search"
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: event.target.value,
                  }))
                }
                placeholder="従業員名や理由で検索"
                value={filters.search}
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto" role="tablist">
              {STATUS_TABS.map((tab) => (
                <Button
                  aria-selected={filters.status === tab.value}
                  key={tab.value}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, status: tab.value }))
                  }
                  role="tab"
                  size="sm"
                  variant={filters.status === tab.value ? "secondary" : "ghost"}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
            <Select
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, sort: value }))
              }
              value={filters.sort}
            >
              <SelectTrigger>
                <SelectValue placeholder="並び順" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">新しい順</SelectItem>
                <SelectItem value="oldest">古い順</SelectItem>
                <SelectItem value="status">ステータス順</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-h-[420px] p-4">
            {isLoading ? (
              <div className="space-y-3">
                {PENDING_SKELETON_IDS.map((id) => (
                  <Skeleton
                    className="h-20 w-full"
                    data-testid="pending-row-skeleton"
                    key={id}
                  />
                ))}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={requests}
                emptyMessage="保留中の申請はありません"
                enableRowSelection
                loading={isLoading}
                onRowClick={(row) => setActiveRequestId(row.id)}
                onRowSelectionChange={handleRowSelectionChange}
                rowSelection={rowSelection}
              />
            )}
          </div>
        </aside>

        {detail}
      </div>

      <BulkActionBar
        isProcessing={
          bulkApproveMutation.isPending || bulkRejectMutation.isPending
        }
        onApproveSelected={handleBulkApprove}
        onClearSelection={handleClearSelection}
        onRejectSelected={handleBulkReject}
        selectedIds={selectedIds}
      />

      <ApprovalDialog
        onOpenChange={setApprovalDialogOpen}
        open={approvalDialogOpen}
        request={activeRequest}
      />
      <RejectionDialog
        onOpenChange={setRejectionDialogOpen}
        open={rejectionDialogOpen}
        request={activeRequest}
      />
      <BulkRejectionDialog
        mutation={bulkRejectMutation}
        onCompleted={handleClearSelection}
        onOpenChange={setBulkRejectionDialogOpen}
        open={bulkRejectionDialogOpen}
        requestCount={selectedIds.length}
        requestIds={selectedIds}
      />
    </section>
  );
};

const useRequestColumns = () =>
  useMemo<ColumnDef<StampRequestListItem>[]>(
    () => [
      {
        id: "select",
        size: 50,
        header: ({ table }) => (
          <DataTableSelectionCheckbox
            aria-label="全て選択"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <DataTableSelectionCheckbox
            aria-label="行を選択"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "employeeName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="従業員" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.employeeName ?? "-"}
            </span>
            <span className="text-muted-foreground text-xs">
              {row.original.dateLabel}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "reason",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="理由" />
        ),
        cell: ({ row }) => (
          <p className="line-clamp-2 text-muted-foreground text-sm">
            {row.original.reason}
          </p>
        ),
      },
      {
        id: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="ステータス" />
        ),
        cell: ({ row }) => <RequestStatusBadge status={row.original.status} />,
      },
    ],
    []
  );

const WorkflowDetailPanel = ({
  request,
  onApprove,
  onReject,
}: {
  request: StampRequestListItem;
  onApprove: () => void;
  onReject: () => void;
}) => (
  <div className="flex flex-1 flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm">
    <div className="flex items-center justify-between border-b pb-4">
      <div>
        <p className="text-muted-foreground text-xs">REQUEST #{request.id}</p>
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-2xl">
            {request.employeeName ?? "-"}
          </h2>
          <RequestStatusBadge status={request.status} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onReject} variant="destructive">
          却下
        </Button>
        <Button onClick={onApprove}>承認</Button>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <InfoCell label="提出日時" value={request.submittedAt} />
      <InfoCell
        label="原本"
        value={formatRange(request.originalInTime, request.originalOutTime)}
      />
      <InfoCell
        label="修正案"
        value={formatRange(request.requestedInTime, request.requestedOutTime)}
      />
    </div>

    <section>
      <h3 className="font-semibold text-muted-foreground text-sm">申請理由</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm">{request.reason}</p>
    </section>
  </div>
);

const InfoCell = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div className="rounded-lg border p-4">
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="mt-1 font-semibold text-lg">{value ?? "-"}</p>
  </div>
);

const formatRange = (start?: string | null, end?: string | null) => {
  if (!(start && end)) {
    return "--";
  }
  return `${start} - ${end}`;
};
