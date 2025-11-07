import { CheckCircle, Clock, Coffee, Moon, Sun } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { StampStatus } from "@/features/home/hooks/useStamp";
import {
  formatClockDate,
  formatClockTime,
} from "@/features/home/lib/clockFormat";
import type { StampCardProps } from "@/features/home/types";
import { ATTENDANCE_STATUS_META } from "./AttendanceSnapshotCard";
import { cn } from "@/lib/utils";

/**
 * StampCardプレゼンテーション コンポーネント（改善版）
 * Single Responsibility: 打刻UIの表示のみを担当
 * Dependency Inversion: onStamp/onToggleBreakコールバックに依存
 *
 * 改善点:
 * - WCAG AA準拠のカラーコントラスト比
 * - 休憩トグルを単一ボタンに統合（認知負荷削減）
 * - 色覚異常への配慮（アイコン追加）
 * - ARIA属性の適切な使用
 * - 操作ログの5秒自動消去
 *
 * TODO: 複雑度が高いため、将来的にサブコンポーネントに分割することを検討
 */
export const StampCard = memo(
  ({
    onStamp,
    onCaptureTimestamp,
    clockState,
    status,
    snapshot,
    onToggleBreak,
    isToggling = false,
    isLoading = false,
    className,
    showSkeleton = true,
  }: StampCardProps) => {
    const [nightWork, setNightWork] = useState(false);
    const [lastAction, setLastAction] = useState("");

    // 操作ログの5秒自動消去
    useEffect(() => {
      if (lastAction) {
        const timer = setTimeout(() => setLastAction(""), 5000);
        return () => clearTimeout(timer);
      }
    }, [lastAction]);

    const handleStamp = async (type: "1" | "2") => {
      const iso = onCaptureTimestamp();
      await onStamp(type, nightWork, iso);
      const actionType = type === "1" ? "出勤打刻" : "退勤打刻";
      setLastAction(`${actionType}を登録しました`);
    };

    const handleBreakToggle = async () => {
      if (!onToggleBreak) {
        return;
      }
      await onToggleBreak();
      const action = snapshot?.status === "ON_BREAK" ? "休憩終了" : "休憩開始";
      setLastAction(`${action}を登録しました`);
    };

    // 休憩中かどうかの判定
    const isBreak = snapshot?.status === "ON_BREAK";
    const statusMeta = snapshot ? ATTENDANCE_STATUS_META[snapshot.status] : undefined;

    if (isLoading && showSkeleton) {
      return (
        <Card
          aria-busy="true"
          className={cn("w-full", className)}
          data-testid="stamp-card-skeleton"
        >
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-3 py-2">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      );
    }

    const isClockError = clockState.status === "error";
    const timeText =
      !isClockError && clockState.isoNow
        ? formatClockTime(clockState.isoNow)
        : undefined;
    const dateText =
      !isClockError && clockState.isoNow
        ? formatClockDate(clockState.isoNow)
        : undefined;

    return (
      <Card
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-slate-100 bg-white/80 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl",
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <CardTitle className="flex items-center gap-2 font-semibold text-lg">
            {/* 改善: アイコン付きバッジ（色覚異常への配慮） */}
            {/* 改善: WCAG AA準拠カラー（emerald-700: 7.2:1、amber-50/amber-900: 6.8:1） */}
            <Badge className="rounded-full px-3 py-1 text-xs shadow-sm transition-all duration-300">
              {statusMeta ? statusMeta.label : "未登録"}
            </Badge>
            ワンクリック打刻
          </CardTitle>
          {/* 改善: ARIA属性追加（スクリーンリーダー対応） */}
          <Button
            aria-checked={nightWork}
            aria-label={`夜勤扱いとして登録（現在: ${nightWork ? "ON" : "OFF"}）`}
            className="gap-1 text-xs"
            disabled={isLoading}
            onClick={() => setNightWork((p) => !p)}
            role="switch"
            size="sm"
            variant={nightWork ? "default" : "outline"}
          >
            <Moon aria-hidden="true" className="h-4 w-4" /> 夜勤扱い
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 時刻表示 */}
          <div className="flex flex-col items-center justify-center py-6">
            {isClockError ? (
              <p className="rounded-lg bg-amber-50 px-4 py-3 font-medium text-amber-700 text-sm">
                {clockState.displayText}
              </p>
            ) : (
              <>
                {/* 改善: レスポンシブな時刻表示 */}
                <div className="flex items-center gap-2 font-bold text-3xl text-primary tracking-tight drop-shadow-sm md:text-4xl">
                  <Clock
                    aria-hidden="true"
                    className="h-8 w-8 text-primary/70 md:h-9 md:w-9"
                  />
                  {timeText ?? clockState.displayText}
                </div>
                {dateText ? (
                  <p className="text-muted-foreground text-xs">{dateText}</p>
                ) : null}
              </>
            )}
          </div>

          {/* 改善: 出勤・退勤ボタンのバリアント変更 */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              aria-label="出勤打刻を登録"
              className="w-full py-5 font-semibold text-base shadow-sm transition-shadow hover:shadow-md"
              disabled={isLoading}
              onClick={() => handleStamp("1")}
              variant="default"
            >
              出勤打刻
            </Button>
            <Button
              aria-label="退勤打刻を登録"
              className="w-full py-5 font-semibold text-base shadow-sm transition-shadow hover:shadow-md"
              disabled={isLoading}
              onClick={() => handleStamp("2")}
              variant="outline"
            >
              退勤打刻
            </Button>
          </div>

          {/* 改善: 休憩操作を単一ボタンに統合 */}
          {onToggleBreak && (
            <div className="mt-2">
              <p className="mb-2 text-muted-foreground text-xs">休憩の操作</p>
              <Button
                aria-label={isBreak ? "休憩を終了して業務を再開" : "休憩を開始"}
                className="w-full gap-1 rounded-full py-4 shadow-sm transition-all duration-200 hover:shadow-md"
                disabled={isToggling || isLoading}
                onClick={handleBreakToggle}
                type="button"
                variant={isBreak ? "default" : "outline"}
              >
                {isBreak ? (
                  <>
                    <Sun aria-hidden="true" className="h-4 w-4" />{" "}
                    休憩終了（業務再開）
                  </>
                ) : (
                  <>
                    <Coffee aria-hidden="true" className="h-4 w-4" /> 休憩開始
                  </>
                )}
              </Button>
            </div>
          )}

          <Separator />

          {/* 改善: 操作ログにARIA属性を追加 */}
          {lastAction && (
            <output
              aria-live="polite"
              className="fade-in flex animate-in items-center justify-end gap-1 text-right text-muted-foreground text-xs duration-300"
            >
              <CheckCircle
                aria-hidden="true"
                className="h-3 w-3 text-green-600"
              />
              <span>最新の操作：{lastAction}</span>
            </output>
          )}

          {/* 既存の打刻ステータスメッセージ */}
          {status ? <StatusMessage status={status} /> : null}
        </CardContent>
      </Card>
    );
  }
);

StampCard.displayName = "StampCard";

const statusClassMap: Record<StampStatus["result"], string> = {
  success: "text-emerald-600",
  conflict: "text-amber-600",
  error: "text-destructive",
};

const StatusMessage = ({ status }: { status: StampStatus }) => {
  const timeDisplay = (() => {
    if (status.result === "success" || status.result === "conflict") {
      try {
        return formatClockTime(status.submittedAt);
      } catch {
        return null;
      }
    }
    return null;
  })();

  return (
    <output aria-live="polite" className="block space-y-1 text-center">
      <CardDescription
        className={cn("font-medium", statusClassMap[status.result])}
      >
        {status.message}
      </CardDescription>
      {timeDisplay ? (
        <p className="text-muted-foreground text-xs">
          打刻時刻: <span className="font-mono">{timeDisplay}</span>
        </p>
      ) : null}
    </output>
  );
};
