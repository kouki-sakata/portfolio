import { Play, TimerReset } from "lucide-react";
import { memo, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyAttendanceSnapshot } from "@/features/home/types";
import { cn } from "@/lib/utils";

import {
  formatAttendanceTime,
  formatOvertimeMinutes,
} from "../lib/attendanceFormat";

type AttendanceSnapshotCardProps = {
  snapshot: DailyAttendanceSnapshot | null | undefined;
  isLoading?: boolean;
  isToggling?: boolean;
  onToggleBreak?: () => Promise<void>;
  className?: string;
};

type StatusMeta = {
  label: string;
  badgeVariant: "default" | "secondary" | "outline" | "destructive";
};

const STATUS_META: Record<DailyAttendanceSnapshot["status"], StatusMeta> = {
  NOT_ATTENDED: { label: "未出勤", badgeVariant: "outline" },
  WORKING: { label: "勤務中", badgeVariant: "secondary" },
  ON_BREAK: { label: "休憩中", badgeVariant: "default" },
  FINISHED: { label: "勤務終了", badgeVariant: "outline" },
};

const AttendanceSnapshotCardComponent = ({
  snapshot,
  isLoading = false,
  isToggling = false,
  onToggleBreak,
  className,
}: AttendanceSnapshotCardProps) => {
  const statusMeta = snapshot ? STATUS_META[snapshot.status] : null;

  const times = useMemo(
    () => [
      {
        label: "出勤時刻",
        value: formatAttendanceTime(snapshot?.attendanceTime),
      },
      {
        label: "休憩開始",
        value: formatAttendanceTime(snapshot?.breakStartTime),
      },
      {
        label: "休憩終了",
        value: formatAttendanceTime(snapshot?.breakEndTime),
      },
      {
        label: "退勤時刻",
        value: formatAttendanceTime(snapshot?.departureTime),
      },
    ],
    [snapshot]
  );

  const overtimeText = formatOvertimeMinutes(snapshot?.overtimeMinutes);

  const canToggleBreak = Boolean(
    onToggleBreak &&
      snapshot &&
      (snapshot.status === "WORKING" || snapshot.status === "ON_BREAK")
  );

  const toggleButtonLabel =
    snapshot?.status === "ON_BREAK" ? "休憩終了" : "休憩開始";
  const ToggleButtonIcon = snapshot?.status === "ON_BREAK" ? TimerReset : Play;

  if (isLoading) {
    return (
      <Card
        className={cn("w-full", className)}
        data-testid="attendance-card-skeleton"
      >
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-24" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center justify-between gap-4 text-xl">
          勤務ステータス
          {statusMeta ? (
            <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
          ) : (
            <Badge variant="outline">未登録</Badge>
          )}
        </CardTitle>
        <CardDescription>
          当日勤務のステータスと休憩状況をリアルタイムに表示します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {times.map(({ label, value }) => (
            <div className="space-y-1" key={label}>
              <p className="text-muted-foreground text-sm">{label}</p>
              {value ? (
                <p className="font-semibold text-lg">{value}</p>
              ) : (
                <Badge className="w-fit" variant="outline">
                  未登録
                </Badge>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm">残業時間</p>
            <p className="font-semibold text-lg">{overtimeText}</p>
          </div>

          {canToggleBreak ? (
            <Button
              className="min-w-[140px]"
              disabled={isToggling}
              onClick={() => {
                onToggleBreak?.().catch(() => {
                  /* エラーハンドリングはuseBreakToggle内で実施 */
                });
              }}
              size="lg"
              variant="outline"
            >
              <ToggleButtonIcon className="mr-2 h-4 w-4" />
              {isToggling ? "更新中..." : toggleButtonLabel}
            </Button>
          ) : null}
        </div>

        {statusMeta ? null : (
          <CardDescription className="rounded-md bg-slate-50 p-4 text-sm">
            現在の勤務情報がまだ登録されていません。打刻または休憩操作を行うとステータスが更新されます。
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
};

export const AttendanceSnapshotCard = memo(AttendanceSnapshotCardComponent);

AttendanceSnapshotCard.displayName = "AttendanceSnapshotCard";
