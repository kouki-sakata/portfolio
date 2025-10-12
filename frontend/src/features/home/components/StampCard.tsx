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
import { cn } from "@/lib/utils";

/**
 * StampCardのProps
 * Interface Segregation: 必要最小限のプロパティ
 */
export type StampCardProps = {
  onStamp: (type: "1" | "2", nightWork: boolean) => Promise<void>;
  isLoading?: boolean;
  message?: string | null;
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
    isLoading = false,
    message = null,
    className,
    showSkeleton = true,
  }: StampCardProps) => {
    const [nightWork, setNightWork] = useState(false);

    const handleStamp = async (type: "1" | "2") => {
      await onStamp(type, nightWork);
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              className="hover:-translate-y-0.5 w-full border border-slate-300 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-100 focus-visible:ring-slate-300 disabled:translate-y-0"
              disabled={isLoading}
              onClick={() => handleStamp("1")}
              size="lg"
              variant="outline"
            >
              出勤打刻
            </Button>
            <Button
              className="hover:-translate-y-0.5 w-full border border-slate-300 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-100 focus-visible:ring-slate-300 disabled:translate-y-0"
              disabled={isLoading}
              onClick={() => handleStamp("2")}
              size="lg"
              variant="outline"
            >
              退勤打刻
            </Button>
          </div>
          {message ? (
            <CardDescription
              className={cn(
                "text-center font-medium",
                message.includes("失敗")
                  ? "text-destructive"
                  : "text-emerald-600"
              )}
            >
              {message}
            </CardDescription>
          ) : null}
        </CardContent>
      </Card>
    );
  }
);

StampCard.displayName = "StampCard";
