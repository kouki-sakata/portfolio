import { useQuery } from "@tanstack/react-query";
import { type FormEvent, lazy, useMemo, useState } from "react";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStampHistory } from "@/features/stampHistory/api";
import { DeleteStampDialog } from "@/features/stampHistory/components/DeleteStampDialog";
import { EditStampDialog } from "@/features/stampHistory/components/EditStampDialog";
import { ExportDialog } from "@/features/stampHistory/components/ExportDialog";
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
  const [filters, setFilters] = useState<{ year?: string; month?: string }>({});
  const [selectedEntry, setSelectedEntry] = useState<StampHistoryEntry | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const activeFilters = useMemo(() => {
    const normalized: { year?: string; month?: string } = {};
    if (filters.year) {
      normalized.year = filters.year;
    }
    if (filters.month) {
      normalized.month = filters.month;
    }
    return normalized;
  }, [filters.month, filters.year]);

  const query = useQuery<StampHistoryResponse>({
    queryKey: queryKeys.stampHistory.list(activeFilters),
    queryFn: () => fetchStampHistory(activeFilters),
    staleTime: QUERY_CONFIG.stampHistory.staleTime,
    gcTime: QUERY_CONFIG.stampHistory.gcTime,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await query.refetch();
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
    selectedYear: filters.year ?? "",
    selectedMonth: filters.month ?? "",
    years: [],
    months: [],
    entries: [],
    summary: { ...emptyMonthlySummary },
  };

  const selectedYear: string = filters.year ?? data.selectedYear;
  const selectedMonth: string = filters.month ?? data.selectedMonth;

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

      <form
        className="flex flex-wrap items-end gap-4"
        onSubmit={(event) => {
          handleSubmit(event).catch(() => {
            // エラーハンドリングは handleSubmit 内で処理済み
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="year">年</Label>
          <Select
            onValueChange={(value) => {
              setFilters((prev) => ({ ...prev, year: value }));
            }}
            value={selectedYear}
          >
            <SelectTrigger className="w-[120px]" id="year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.years.map((yearOption) => (
                <SelectItem key={yearOption} value={yearOption}>
                  {yearOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="month">月</Label>
          <Select
            onValueChange={(value) => {
              setFilters((prev) => ({ ...prev, month: value }));
            }}
            value={selectedMonth}
          >
            <SelectTrigger className="w-[120px]" id="month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.months.map((monthOption) => (
                <SelectItem key={monthOption} value={monthOption}>
                  {monthOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button disabled={query.isRefetching} type="submit">
          {query.isRefetching ? "更新中…" : "検索"}
        </Button>
      </form>

      <SuspenseWrapper fallbackType="skeleton-card">
        <MonthlyStatsCard entries={data.entries} summary={data.summary} />
      </SuspenseWrapper>

        <div className="mt-6">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-sm">
                      日付
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm">
                      曜日
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm">
                      出勤時刻
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm">
                      退勤時刻
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm">
                      更新日時
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.entries.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-8 text-center text-muted-foreground"
                        colSpan={6}
                      >
                        対象期間の打刻はありません。
                      </td>
                    </tr>
                  ) : (
                    data.entries.map((entry) => (
                      <tr
                        className="hover:bg-muted/50"
                        key={`${entry.year}-${entry.month}-${entry.day}`}
                      >
                        <td className="px-4 py-3">
                          {entry.year}/{entry.month}/{entry.day}
                        </td>
                        <td className="px-4 py-3">{entry.dayOfWeek}</td>
                        <td className="px-4 py-3">{entry.inTime ?? "-"}</td>
                        <td className="px-4 py-3">{entry.outTime ?? "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-sm">
                          {entry.updateDate ?? "-"}
                        </td>
                        <td className="px-4 py-3">
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

    <SkeletonTable className="bg-card" columns={6} rows={6} showHeader />
  </div>
);
