import { memo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeClockPanel } from "@/features/home/components/HomeClockPanel";
import type { HomeClockState } from "@/features/home/hooks/useHomeClock";
import type { StampStatus } from "@/features/home/hooks/useStamp";
import { formatClockTime } from "@/features/home/lib/clockFormat";
import { cn } from "@/lib/utils";

/**
 * StampCardのProps
 * Interface Segregation: 必要最小限のプロパティ
 */
export type StampCardProps = {
  onStamp: (type: "1" | "2", nightWork: boolean, iso?: string) => Promise<void>;
  onCaptureTimestamp: () => string;
  clockState: HomeClockState;
  status: StampStatus | null;
  isLoading?: boolean;
  className?: string;
  showSkeleton?: boolean;
};

/**
 * StampCardプレゼンテーション コンポーネント
 * Single Responsibility: 打刻UIの表示のみを担当
 * Dependency Inversion: onStampコールバックに依存
 */
export const StampCard = memo(
  ({
    onStamp,
    onCaptureTimestamp,
    clockState,
    status,
    isLoading = false,
    className,
    showSkeleton = true,
  }: StampCardProps) => {
    const [nightWork, setNightWork] = useState(false);

    const handleStamp = async (type: "1" | "2") => {
      const iso = onCaptureTimestamp();
      await onStamp(type, nightWork, iso);
    };

    if (isLoading && showSkeleton) {
      return (
        <Card
          aria-busy="true"
          className={cn("w-full", className)}
          data-testid="stamp-card-skeleton"
        >
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-semibold text-lg text-slate-900">
              ワンクリック打刻
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                aria-label="夜勤扱い"
                checked={nightWork}
                disabled={isLoading}
                id="nightwork"
                onCheckedChange={(checked) => setNightWork(checked === true)}
              />
              <label
                className="font-medium text-slate-800 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="nightwork"
              >
                夜勤扱い
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <HomeClockPanel state={clockState} variant="card" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              className="hover:-translate-y-0.5 w-full border border-slate-300 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-100/50 focus-visible:ring-slate-300 disabled:translate-y-0"
              disabled={isLoading}
              onClick={() => handleStamp("1")}
              size="lg"
              variant="outline"
            >
              出勤打刻
            </Button>
            <Button
              className="hover:-translate-y-0.5 w-full border border-slate-300 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-100/50 focus-visible:ring-slate-300 disabled:translate-y-0"
              disabled={isLoading}
              onClick={() => handleStamp("2")}
              size="lg"
              variant="outline"
            >
              退勤打刻
            </Button>
          </div>
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
