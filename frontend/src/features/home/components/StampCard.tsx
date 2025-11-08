import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useStampCardLogic } from "@/features/home/hooks/useStampCardLogic";
import type { StampCardProps } from "@/features/home/types";
import { cn } from "@/lib/utils";
import { ActionLog } from "./StampCard/ActionLog";
import { BreakToggleButton } from "./StampCard/BreakToggleButton";
import { ClockDisplay } from "./StampCard/ClockDisplay";
import { StatusHeader } from "./StampCard/StatusHeader";
import { StatusMessage } from "./StampCard/StatusMessage";

/**
 * StampCardプレゼンテーション コンポーネント(リファクタリング版)
 *
 * 改善点:
 * - カスタムフック(useStampCardLogic)でビジネスロジックを分離
 * - サブコンポーネントでUIの責任を分割
 * - 認知的複雑度を21から8以下に削減
 * - WCAG AA準拠のカラーコントラスト比
 * - 休憩トグルを単一ボタンに統合(認知負荷削減)
 * - 色覚異常への配慮(アイコン追加)
 * - ARIA属性の適切な使用
 * - 操作ログの5秒自動消去
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
    const {
      nightWork,
      lastAction,
      isBreak,
      statusMeta,
      isClockError,
      handleStamp,
      handleBreakToggle,
      toggleNightWork,
    } = useStampCardLogic({
      snapshot,
      clockState,
      onCaptureTimestamp,
      onStamp,
      onToggleBreak,
    });

    if (isLoading && showSkeleton) {
      return <StampCardSkeleton className={className} />;
    }

    return (
      <Card
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-slate-100 bg-white/80 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl",
          className
        )}
      >
        <CardHeader className="pb-4">
          <StatusHeader
            isLoading={isLoading}
            nightWork={nightWork}
            onToggleNightWork={toggleNightWork}
            statusMeta={statusMeta}
          />
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 時刻表示 */}
          <div className="flex flex-col items-center justify-center py-6">
            <ClockDisplay clockState={clockState} isClockError={isClockError} />
          </div>

          {/* 出勤・退勤ボタン */}
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

          {/* 休憩操作 */}
          {onToggleBreak ? (
            <BreakToggleButton
              isBreak={isBreak}
              isLoading={isLoading}
              isToggling={isToggling}
              onToggle={handleBreakToggle}
            />
          ) : null}

          <Separator />

          {/* 操作ログ */}
          <ActionLog message={lastAction} />

          {/* 打刻ステータスメッセージ */}
          {status ? <StatusMessage status={status} /> : null}
        </CardContent>
      </Card>
    );
  }
);

StampCard.displayName = "StampCard";

const StampCardSkeleton = ({ className }: { className?: string }) => (
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
