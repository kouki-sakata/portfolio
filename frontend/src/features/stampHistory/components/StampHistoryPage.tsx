import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { type FormEvent, lazy, type ReactNode, useMemo, useState } from "react";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchStampHistory } from "@/features/stampHistory/api";
import { DeleteStampDialog } from "@/features/stampHistory/components/DeleteStampDialog";
import { EditStampDialog } from "@/features/stampHistory/components/EditStampDialog";
import { ExportDialog } from "@/features/stampHistory/components/ExportDialog";
import { StampHistoryCard } from "@/features/stampHistory/components/StampHistoryCard";
import {
  emptyMonthlySummary,
  type StampHistoryEntry,
  type StampHistoryResponse,
} from "@/features/stampHistory/types";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";
import { SuspenseWrapper } from "@/shared/components/loading/SuspenseWrapper";
import {
  SkeletonCard,
  SkeletonForm,
  SkeletonTable,
} from "@/shared/components/loading/skeletons/SkeletonVariants";
import { queryKeys } from "@/shared/utils/queryUtils";

const MonthlyStatsCard = lazy(() =>
  import("@/features/stampHistory/components/MonthlyStatsCard").then(
    (module) => ({
      default: module.MonthlyStatsCard,
    })
  )
);

export const StampHistoryPage = () => {
  // 選択中の年月（ローカル状態）
  const [filters, setFilters] = useState<{ year?: string; month?: string }>(
    () => {
      const now = new Date();
      return {
        year: now.getFullYear().toString(),
        month: (now.getMonth() + 1).toString().padStart(2, "0"),
      };
    }
  );

  // 確定済みの年月（API呼び出しに使用）
  const [confirmedFilters, setConfirmedFilters] = useState<{
    year?: string;
    month?: string;
  }>(() => {
    const now = new Date();
    return {
      year: now.getFullYear().toString(),
      month: (now.getMonth() + 1).toString().padStart(2, "0"),
    };
  });

  const [selectedEntry, setSelectedEntry] = useState<StampHistoryEntry | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const activeFilters = useMemo(() => {
    const normalized: { year?: string; month?: string } = {};
    if (confirmedFilters.year) {
      normalized.year = confirmedFilters.year;
    }
    if (confirmedFilters.month) {
      normalized.month = confirmedFilters.month;
    }
    return normalized;
  }, [confirmedFilters.month, confirmedFilters.year]);

  const query = useQuery<StampHistoryResponse>({
    queryKey: queryKeys.stampHistory.list(activeFilters),
    queryFn: () => fetchStampHistory(activeFilters),
    staleTime: QUERY_CONFIG.stampHistory.staleTime,
    gcTime: QUERY_CONFIG.stampHistory.gcTime,
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirmedFilters(filters);
  };

  const handleEdit = (entry: StampHistoryEntry) => {
    setSelectedEntry(entry);
    setEditDialogOpen(true);
  };

  const handleDelete = (entry: StampHistoryEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  if (query.isLoading) {
    return <StampHistorySkeleton />;
  }

  if (query.isError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">履歴を取得できませんでした。</p>
      </div>
    );
  }

  const data: StampHistoryResponse = query.data ?? {
    selectedYear: confirmedFilters.year ?? "",
    selectedMonth: confirmedFilters.month ?? "",
    years: [],
    months: [],
    entries: [],
    summary: { ...emptyMonthlySummary },
  };

  // 現在選択中の年月（確定前）を表示
  const selectedYear: string | undefined = filters.year;
  const selectedMonth: string | undefined = filters.month;

  // 選択された値が選択肢に含まれることを保証
  const years =
    selectedYear && selectedYear !== "" && !data.years.includes(selectedYear)
      ? [selectedYear, ...data.years]
      : data.years;
  const months =
    selectedMonth &&
    selectedMonth !== "" &&
    !data.months.includes(selectedMonth)
      ? [selectedMonth, ...data.months]
      : data.months;

  return (
    <div className="container mx-auto space-y-6 py-8">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="font-bold text-3xl">打刻履歴</h1>
          <p className="text-muted-foreground">
            対象年月を指定して打刻履歴を確認できます。
          </p>
        </div>
        <ExportDialog disabled={query.isLoading} entries={data.entries} />
      </header>

      <form className="flex flex-wrap gap-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Select
            onValueChange={(value) => {
              setFilters((prev) => ({ ...prev, year: value }));
            }}
            value={selectedYear}
          >
            <SelectTrigger className="w-[120px]" id="year">
              <SelectValue placeholder="年を選択" />
            </SelectTrigger>
            <SelectContent>
              {years.map((yearOption) => (
                <SelectItem key={yearOption} value={yearOption}>
                  {yearOption}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Select
            onValueChange={(value) => {
              setFilters((prev) => ({ ...prev, month: value }));
            }}
            value={selectedMonth}
          >
            <SelectTrigger className="w-[120px]" id="month">
              <SelectValue placeholder="月を選択" />
            </SelectTrigger>
            <SelectContent>
              {months.map((monthOption) => (
                <SelectItem key={monthOption} value={monthOption}>
                  {Number.parseInt(monthOption, 10)}月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="min-w-[100px]"
          disabled={query.isRefetching}
          type="submit"
        >
          {query.isRefetching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              更新中…
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              検索
            </>
          )}
        </Button>
      </form>

      <SuspenseWrapper fallbackType="skeleton-card">
        <MonthlyStatsCard entries={data.entries} summary={data.summary} />
      </SuspenseWrapper>

      {/* Card layout for mobile and tablet (< lg) */}
      {data.entries.length === 0 ? (
        <Card className="block lg:hidden">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              対象期間の打刻はありません。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="block space-y-4 lg:hidden" role="list">
          {data.entries.map((entry) => (
            <StampHistoryCard
              entry={entry}
              key={`card-${entry.year}-${entry.month}-${entry.day}`}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Table layout for desktop (>= lg) */}
      <div className="mt-6 hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日付</TableHead>
              <TableHead>曜日</TableHead>
              <TableHead>出勤時刻</TableHead>
              <TableHead>退勤時刻</TableHead>
              <TableHead>休憩開始</TableHead>
              <TableHead>休憩終了</TableHead>
              <TableHead>残業</TableHead>
              <TableHead>更新日時</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.entries.length === 0 ? (
              <TableRow>
                <TableCell
                  className="py-8 text-center text-muted-foreground"
                  colSpan={9}
                >
                  対象期間の打刻はありません。
                </TableCell>
              </TableRow>
            ) : (
              data.entries.map((entry) => (
                <TableRow
                  key={`table-${entry.year}-${entry.month}-${entry.day}`}
                >
                  <TableCell>
                    {entry.year}/{entry.month}/{entry.day}
                  </TableCell>
                  <TableCell>{entry.dayOfWeek}</TableCell>
                  <TableCell>{renderOptionalTime(entry.inTime)}</TableCell>
                  <TableCell>{renderOptionalTime(entry.outTime)}</TableCell>
                  <TableCell>
                    {renderBreakTimeCell(entry.breakStartTime)}
                  </TableCell>
                  <TableCell>
                    {renderBreakTimeCell(entry.breakEndTime)}
                  </TableCell>
                  <TableCell>
                    {renderOvertimeCell(entry.overtimeMinutes)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {entry.updateDate ?? "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        disabled={!entry.id}
                        onClick={() => handleEdit(entry)}
                        size="sm"
                        variant="ghost"
                      >
                        <SpriteIcon
                          className="h-4 w-4"
                          decorative
                          name="edit"
                        />
                        <span className="sr-only">編集</span>
                      </Button>
                      <Button
                        disabled={!entry.id}
                        onClick={() => handleDelete(entry)}
                        size="sm"
                        variant="ghost"
                      >
                        <SpriteIcon
                          className="h-4 w-4"
                          decorative
                          name="trash-2"
                        />
                        <span className="sr-only">削除</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditStampDialog
        entry={selectedEntry}
        onOpenChange={setEditDialogOpen}
        open={editDialogOpen}
      />

      <DeleteStampDialog
        entry={selectedEntry}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
      />
    </div>
  );
};

const StampHistorySkeleton = () => (
  <div
    className="container mx-auto space-y-6 py-8"
    data-testid="stamp-history-skeleton"
  >
    <header className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-28" />
    </header>

    <SkeletonCard className="bg-card" />

    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <SkeletonForm className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2" />
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-24" />
      </div>
    </div>

    {/* Card skeleton for mobile/tablet */}
    <div className="block space-y-4 lg:hidden">
      {Array.from({ length: 5 }, (_, index) => (
        <Card key={`skeleton-card-${index}`}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Table skeleton for desktop */}
    <div className="hidden lg:block">
      <SkeletonTable className="bg-card" columns={9} rows={6} showHeader />
    </div>
  </div>
);

const renderBreakTimeCell = (value: string | null): ReactNode =>
  value && value.trim().length > 0 ? value : "-";

const renderOvertimeCell = (value: number | null): ReactNode => {
  if (value === null || value === undefined) {
    return "-";
  }

  const normalized = Number.isFinite(value) ? value : 0;
  if (normalized <= 0) {
    return "0分";
  }

  return `${normalized}分`;
};

const renderOptionalTime = (value: string | null): ReactNode =>
  value && value.trim().length > 0 ? value : "-";
