import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";

type SessionTimeoutWarningProps = {
  timeRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
  onDismiss?: () => void;
  show?: boolean;
  urgent?: boolean;
};

const formatTime = (seconds: number): string => {
  if (seconds <= 0) {
    return "0秒";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes.toString()}分${remainingSeconds.toString()}秒`;
  }
  return `${seconds.toString()}秒`;
};

export const SessionTimeoutWarning = ({
  timeRemaining,
  onExtend,
  onLogout,
  onDismiss,
  show = true,
  urgent = false,
}: SessionTimeoutWarningProps) => {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  const isUrgent = urgent || displayTime <= 60;

  if (!show) {
    return null;
  }

  return (
    <Alert
      aria-atomic="true"
      aria-live={isUrgent ? "assertive" : "polite"}
      className={cn(
        "fixed right-4 bottom-4 z-50 max-w-md shadow-lg",
        isUrgent ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <SpriteIcon
          className={cn(
            "h-5 w-5 flex-shrink-0",
            isUrgent ? "text-red-600" : "text-yellow-600"
          )}
          decorative
          name="alert-triangle"
        />

        <div className="flex-1">
          <AlertTitle className="mb-2">
            セッションの有効期限が近づいています
          </AlertTitle>

          <AlertDescription>
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <SpriteIcon className="h-4 w-4" decorative name="clock" />
                <span className="font-semibold">
                  残り時間: {formatTime(displayTime)}
                </span>
              </div>
              <p className="mt-1 text-sm">
                セッションを延長するか、作業内容を保存してログアウトしてください。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                className="flex items-center gap-1"
                onClick={onExtend}
                size="sm"
                variant={isUrgent ? "destructive" : "default"}
              >
                <SpriteIcon className="h-3 w-3" decorative name="refresh-cw" />
                セッションを延長
              </Button>

              <Button
                className="flex items-center gap-1"
                onClick={onLogout}
                size="sm"
                variant="outline"
              >
                <SpriteIcon className="h-3 w-3" decorative name="log-out" />
                ログアウト
              </Button>

              {onDismiss && (
                <Button
                  aria-label="閉じる"
                  className="flex items-center gap-1"
                  onClick={onDismiss}
                  size="sm"
                  variant="ghost"
                >
                  <SpriteIcon className="h-3 w-3" decorative name="x" />
                  閉じる
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
