import { Loader2 } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  onDismissMessage?: () => void;
  /**
   * メッセージを自動でクリアするまでの遅延（ミリ秒）
   *
   * @default 5000
   */
  autoDismissDelay?: number;
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
    onDismissMessage,
    autoDismissDelay = 5000,
  }: StampCardProps) => {
    const [nightWork, setNightWork] = useState(false);

    const handleStamp = async (type: "1" | "2") => {
      await onStamp(type, nightWork);
    };

    useEffect(() => {
      if (!message || !onDismissMessage) {
        return;
      }

      const timer = window.setTimeout(() => {
        onDismissMessage();
      }, autoDismissDelay);

      return () => {
        window.clearTimeout(timer);
      };
    }, [autoDismissDelay, message, onDismissMessage]);

    const messageStyles = useMemo(() => {
      if (!message) {
        return "";
      }

      const isErrorMessage = message.includes("失敗") ||
        message.includes("エラー");

      return isErrorMessage
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
    }, [message]);

    return (
      <Card
        className={cn(
          "w-full border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md",
          className
        )}
      >
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-slate-900">
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
                className="font-medium text-slate-700 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
              className="w-full justify-center bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 focus-visible:ring-blue-500"
              disabled={isLoading}
              onClick={() => handleStamp("1")}
              size="lg"
              variant="default"
            >
              {isLoading ? (
                <>
                  <Loader2
                    aria-hidden
                    className="h-4 w-4 animate-spin"
                  />
                  処理中...
                </>
              ) : (
                "出勤打刻"
              )}
            </Button>
            <Button
              className="w-full justify-center border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition-all hover:bg-blue-100 focus-visible:ring-blue-400"
              disabled={isLoading}
              onClick={() => handleStamp("2")}
              size="lg"
              variant="secondary"
            >
              {isLoading ? (
                <>
                  <Loader2
                    aria-hidden
                    className="h-4 w-4 animate-spin"
                  />
                  処理中...
                </>
              ) : (
                "退勤打刻"
              )}
            </Button>
          </div>
          {message ? (
            <CardDescription
              aria-live="polite"
              className={cn(
                "rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors",
                messageStyles
              )}
              role="status"
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
