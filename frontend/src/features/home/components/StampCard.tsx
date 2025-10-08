import { memo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";

/**
 * StampCardのProps
 * Interface Segregation: 必要最小限のプロパティ
 */
export type StampCardProps = {
  onStamp: (type: "1" | "2", nightWork: boolean) => Promise<void>;
  isLoading?: boolean;
  message?: string | null;
  messageStatus?: "success" | "error" | null;
  onDismissMessage?: () => void;
  className?: string;
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
    messageStatus = null,
    onDismissMessage,
    className,
  }: StampCardProps) => {
    const [nightWork, setNightWork] = useState(false);

    const handleStamp = async (type: "1" | "2") => {
      try {
        await onStamp(type, nightWork);
      } catch {
        // エラーメッセージは親フックで処理されるため握りつぶす
      }
    };

    const isError = messageStatus === "error";

    return (
      <Card
        className={cn(
          "w-full border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 shadow-md",
          className
        )}
        data-testid="stamp-card"
      >
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-semibold text-slate-900 text-xl">
                ワンクリック打刻
              </CardTitle>
              <p className="text-slate-600 text-sm">
                出勤・退勤を素早く登録できます。夜勤フラグは次回の打刻時に反映されます。
              </p>
            </div>
            <div className="flex items-center gap-2">
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
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Button
              className="w-full border border-primary/30 shadow-sm"
              disabled={isLoading}
              onClick={() => handleStamp("1")}
              size="lg"
              variant="default"
            >
              出勤打刻
            </Button>
            <Button
              className="w-full border border-slate-300/80 bg-white text-slate-900 shadow-sm hover:bg-slate-100"
              disabled={isLoading}
              onClick={() => handleStamp("2")}
              size="lg"
              variant="outline"
            >
              退勤打刻
            </Button>
          </div>
          {message ? (
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-sm shadow-sm",
                isError
                  ? "border-red-200/70 bg-red-50 text-red-700"
                  : "border-emerald-200/70 bg-emerald-50 text-emerald-800"
              )}
            >
              <SpriteIcon
                aria-hidden="true"
                className={cn(
                  "mt-0.5 h-4 w-4 flex-shrink-0",
                  isError ? "text-red-600" : "text-emerald-600"
                )}
                name={isError ? "alert-triangle" : "check"}
              />
              <div className="flex-1 space-y-1">
                <p className="font-medium leading-tight">{message}</p>
                {isError ? (
                  <p className="text-red-600/80 text-xs">
                    ネットワーク状況をご確認の上、時間を置いてから再度お試しください。
                  </p>
                ) : (
                  <p className="text-emerald-700/80 text-xs">
                    勤怠履歴に反映されるまで数秒かかる場合があります。
                  </p>
                )}
              </div>
              {onDismissMessage ? (
                <button
                  aria-label="メッセージを閉じる"
                  className="rounded-full p-1 text-slate-500 transition-colors hover:bg-black/5 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  onClick={onDismissMessage}
                  type="button"
                >
                  <SpriteIcon className="h-4 w-4" decorative name="x" />
                </button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }
);

StampCard.displayName = "StampCard";
