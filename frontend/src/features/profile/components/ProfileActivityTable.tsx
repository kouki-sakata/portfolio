import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileActivityEntryViewModel } from "@/features/profile/types";
import { DataTable } from "@/shared/components/data-table/DataTable";
import {
  type DateFormatOptions,
  useMemoizedDateFormatter,
} from "@/shared/hooks/useMemoizedDateFormatter";
import { cn } from "@/shared/utils/cn";

const OPERATION_LABEL: Record<
  ProfileActivityEntryViewModel["operationType"],
  string
> = {
  UPDATE: "更新",
  VIEW: "閲覧",
};

const PROFILE_DATETIME_OPTIONS: DateFormatOptions = {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

export type ProfileActivityTableProps = {
  entries: ProfileActivityEntryViewModel[];
  page: number;
  pageSize: number;
  totalCount: number;
  loading?: boolean;
  onPaginationChange?: (state: PaginationState) => void;
};

export const ProfileActivityTable = ({
  entries,
  page,
  pageSize,
  totalCount,
  loading = false,
  onPaginationChange,
}: ProfileActivityTableProps) => {
  const [selectedEntry, setSelectedEntry] =
    useState<ProfileActivityEntryViewModel | null>(null);

  const formatDateTime = useMemoizedDateFormatter(
    "ja-JP",
    PROFILE_DATETIME_OPTIONS
  );

  useEffect(() => {
    if (selectedEntry) {
      const exists = entries.some((entry) => entry.id === selectedEntry.id);
      if (!exists) {
        setSelectedEntry(null);
      }
    }
  }, [entries, selectedEntry]);

  const paginationState = useMemo<PaginationState>(
    () => ({
      pageIndex: page,
      pageSize,
    }),
    [page, pageSize]
  );

  const columns = useMemo<ColumnDef<ProfileActivityEntryViewModel>[]>(
    () => [
      {
        accessorKey: "occurredAt",
        header: "操作日時",
        cell: ({ getValue }) => {
          const value = String(getValue() ?? "");
          return value ? formatDateTime(value) : "不明";
        },
      },
      {
        accessorKey: "actor",
        header: "実行者",
      },
      {
        accessorKey: "operationType",
        header: "操作種別",
        cell: ({ getValue }) => {
          const type = getValue();
          const label =
            typeof type === "string" && type in OPERATION_LABEL
              ? OPERATION_LABEL[type as keyof typeof OPERATION_LABEL]
              : "不明";
          const variant =
            type === "UPDATE" ? "default" : ("secondary" as const);

          return <Badge variant={variant}>{label}</Badge>;
        },
      },
      {
        accessorKey: "summary",
        header: "概要",
        cell: ({ getValue }) => (
          <span className="line-clamp-2 text-foreground text-sm">
            {String(getValue() ?? "")}
          </span>
        ),
      },
      {
        id: "changes",
        header: "変更項目",
        cell: ({ row }) => {
          const fields = row.original.changedFields;
          if (!fields || fields.length === 0) {
            return <span className="text-muted-foreground text-xs">なし</span>;
          }

          return (
            <div className="flex flex-wrap gap-1">
              {fields.map((field) => (
                <Badge key={field} variant="outline">
                  {field}
                </Badge>
              ))}
            </div>
          );
        },
      },
    ],
    [formatDateTime]
  );

  const handlePaginationChange = (
    updater: PaginationState | ((old: PaginationState) => PaginationState)
  ) => {
    if (!onPaginationChange) {
      return;
    }

    const nextState =
      typeof updater === "function" ? updater(paginationState) : updater;

    onPaginationChange(nextState);
  };

  if (loading) {
    return (
      <div className="space-y-3" data-testid="profile-activity-skeleton">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="h-12 animate-pulse rounded-md bg-muted/60"
            key={`activity-skeleton-${index}`}
          />
        ))}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="rounded-lg border border-border/60 border-dashed bg-muted/10 p-6 text-center text-muted-foreground text-sm">
        活動履歴はまだありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={entries}
        emptyMessage="活動履歴はまだありません"
        onPaginationChange={handlePaginationChange}
        onRowClick={setSelectedEntry}
        pagination={onPaginationChange ? paginationState : undefined}
        totalCount={onPaginationChange ? totalCount : undefined}
      />

      {selectedEntry ? (
        <Card aria-live="polite" className="border border-primary/30 shadow-sm">
          <CardHeader>
            <CardTitle className="font-semibold text-lg">
              変更された項目
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
                  変更前
                </dt>
                <dd className="mt-2 space-y-2 text-sm">
                  {Object.entries(selectedEntry.beforeSnapshot).length === 0 ? (
                    <p className="text-muted-foreground">記録なし</p>
                  ) : (
                    Object.entries(selectedEntry.beforeSnapshot).map(
                      ([field, value]) => (
                        <div
                          className={cn(
                            "rounded-md border border-border/60 bg-background px-3 py-2",
                            "text-muted-foreground"
                          )}
                          key={`before-${field}`}
                        >
                          <span className="block font-medium text-muted-foreground/80 text-xs uppercase tracking-wide">
                            {field}
                          </span>
                          <span>{value ?? "未設定"}</span>
                        </div>
                      )
                    )
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
                  変更後
                </dt>
                <dd className="mt-2 space-y-2 text-sm">
                  {Object.entries(selectedEntry.afterSnapshot).length === 0 ? (
                    <p className="text-muted-foreground">記録なし</p>
                  ) : (
                    Object.entries(selectedEntry.afterSnapshot).map(
                      ([field, value]) => (
                        <div
                          className={cn(
                            "rounded-md border border-primary/50 bg-primary/5 px-3 py-2",
                            "text-foreground"
                          )}
                          key={`after-${field}`}
                        >
                          <span className="block font-medium text-primary text-xs uppercase tracking-wide">
                            {field}
                          </span>
                          <span>{value ?? "未設定"}</span>
                        </div>
                      )
                    )
                  )}
                </dd>
              </div>
            </dl>
            <p className="text-muted-foreground text-xs">
              選択したレコード: {formatDateTime(selectedEntry.occurredAt)} に{" "}
              {selectedEntry.actor} が{" "}
              {OPERATION_LABEL[selectedEntry.operationType]} を実行
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border/50 border-dashed bg-muted/10 p-4 text-muted-foreground text-sm">
          詳細を確認したい行をクリックすると差分が表示されます。
        </div>
      )}
    </div>
  );
};
