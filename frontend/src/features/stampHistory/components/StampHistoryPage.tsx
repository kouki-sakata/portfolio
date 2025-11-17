import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { type FormEvent, lazy, useCallback, useMemo, useState } from "react";

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
import { useAuth } from "@/features/auth/hooks/useAuth";
import { fetchStampHistory } from "@/features/stampHistory/api";
import { DeleteStampDialog } from "@/features/stampHistory/components/DeleteStampDialog";
import { ExportDialog } from "@/features/stampHistory/components/ExportDialog";
import { StampHistoryCard } from "@/features/stampHistory/components/StampHistoryCard";
import {
  renderBreakTimeCell,
  renderOptionalTime,
  renderOvertimeCell,
} from "@/features/stampHistory/lib/formatters";
import {
  emptyMonthlySummary,
  type StampHistoryEntry,
  type StampHistoryResponse,
} from "@/features/stampHistory/types";
import { RequestCorrectionModal } from "@/features/stampRequestWorkflow/components/RequestCorrectionModal";
import { RequestStatusBadge } from "@/features/stampRequestWorkflow/components/RequestStatusBadge";
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
  const { user } = useAuth();

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestTarget, setRequestTarget] = useState<StampHistoryEntry | null>(
    null
  );

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

  const handleDelete = useCallback((entry: StampHistoryEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  }, []);

  const handleRequest = useCallback((entry: StampHistoryEntry) => {
    if (!entry.id) {
      return;
    }
    setRequestTarget(entry);
    setRequestDialogOpen(true);
  }, []);

  const createDummyEntry = useCallback(
    (
      year: string,
      month: string,
      day: number,
      employeeId: number | null
    ): StampHistoryEntry => {
      const dayStr = day.toString().padStart(2, "0");
      const date = new Date(
        Number.parseInt(year, 10),
        Number.parseInt(month, 10) - 1,
        day
      );
      const dayOfWeekNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

      return {
        id: null,
        employeeId,
        year,
        month,
        day: dayStr,
        dayOfWeek: dayOfWeekNames[date.getDay()] ?? null,
        inTime: null,
        outTime: null,
        breakStartTime: null,
        breakEndTime: null,
        overtimeMinutes: null,
        isNightShift: null,
        updateDate: null,
        requestStatus: "NONE",
        requestId: null,
      };
    },
    []
  );

  // 選択された年月の全日付を生成する関数
  const generateAllDaysInMonth = useCallback(
    (year: string, month: string, entries: StampHistoryEntry[]) => {
      if (!(year && month)) {
        return entries;
      }

      const daysInMonth = new Date(
        Number.parseInt(year, 10),
        Number.parseInt(month, 10),
        0
      ).getDate();
      const allDays: StampHistoryEntry[] = [];

      // 既存のentriesをMapに変換（day をキーとして高速検索）
      const entryMap = new Map<string, StampHistoryEntry>();
      for (const entry of entries) {
        if (entry.day) {
          entryMap.set(entry.day, entry);
        }
      }

      // 現在のユーザーIDを優先的に使用、なければ既存エントリから取得
      const defaultEmployeeId = user?.id ?? entries[0]?.employeeId ?? null;

      // 全日付を生成
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = day.toString().padStart(2, "0");
        const existingEntry = entryMap.get(dayStr);

        if (existingEntry) {
          allDays.push(existingEntry);
        } else {
          allDays.push(createDummyEntry(year, month, day, defaultEmployeeId));
        }
      }

      return allDays;
    },
    [createDummyEntry, user?.id]
  );

  // 全日付を含むentriesを生成 (hooks must be called before early returns)
  const data: StampHistoryResponse = query.data ?? {
    selectedYear: confirmedFilters.year ?? "",
    selectedMonth: confirmedFilters.month ?? "",
    years: [],
    months: [],
    entries: [],
    summary: { ...emptyMonthlySummary },
  };

  const allEntriesWithDays = useMemo(
    () =>
      generateAllDaysInMonth(
        data.selectedYear,
        data.selectedMonth,
        data.entries
      ),
    [
      data.selectedYear,
      data.selectedMonth,
      data.entries,
      generateAllDaysInMonth,
    ]
  );

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
      <ul className="block list-none space-y-4 lg:hidden">
        {allEntriesWithDays.map((entry) => (
          <StampHistoryCard
            entry={entry}
            key={`card-${entry.year}-${entry.month}-${entry.day}`}
            onDelete={handleDelete}
            onEdit={handleRequest}
          />
        ))}
      </ul>

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
              <TableHead>夜勤</TableHead>
              <TableHead>更新日時</TableHead>
              <TableHead>申請</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allEntriesWithDays.map((entry) => (
              <TableRow key={`table-${entry.year}-${entry.month}-${entry.day}`}>
                <TableCell>
                  {entry.year}/{entry.month}/{entry.day}
                </TableCell>
                <TableCell>{entry.dayOfWeek}</TableCell>
                <TableCell>{renderOptionalTime(entry.inTime)}</TableCell>
                <TableCell>{renderOptionalTime(entry.outTime)}</TableCell>
                <TableCell>
                  {renderBreakTimeCell(entry.breakStartTime)}
                </TableCell>
                <TableCell>{renderBreakTimeCell(entry.breakEndTime)}</TableCell>
                <TableCell>
                  {renderOvertimeCell(entry.overtimeMinutes)}
                </TableCell>
                <TableCell>
                  {entry.isNightShift ? (
                    <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-1 font-medium text-purple-700 text-xs">
                      夜勤
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {entry.updateDate ?? "-"}
                </TableCell>
                <TableCell>
                  <RequestStatusBadge status={entry.requestStatus ?? "NONE"} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRequest(entry)}
                      size="sm"
                      variant="ghost"
                    >
                      <SpriteIcon className="h-4 w-4" decorative name="edit" />
                      <span className="sr-only">修正申請</span>
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
                    {entry.id ? (
                      <Button
                        aria-label="修正申請"
                        disabled={entry.requestStatus === "PENDING"}
                        onClick={() => handleRequest(entry)}
                        size="sm"
                        variant="ghost"
                      >
                        <SpriteIcon
                          className="h-4 w-4"
                          decorative
                          name="edit"
                        />
                        <span className="sr-only">修正申請</span>
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteStampDialog
        entry={selectedEntry}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
      />
      <RequestCorrectionModal
        entry={requestTarget}
        onOpenChange={(open) => {
          setRequestDialogOpen(open);
          if (!open) {
            setRequestTarget(null);
          }
        }}
        open={requestDialogOpen && Boolean(requestTarget)}
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
      {[
        "skeleton-0",
        "skeleton-1",
        "skeleton-2",
        "skeleton-3",
        "skeleton-4",
      ].map((id) => (
        <Card key={id}>
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
