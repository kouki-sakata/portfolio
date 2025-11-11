import { Clock } from "lucide-react";
import { memo } from "react";
import {
  formatClockDate,
  formatClockTime,
} from "@/features/home/lib/clockFormat";
import { useClockDisplay } from "@/features/home/hooks/useClockDisplay";

/**
 * 時計表示コンポーネント
 *
 * このコンポーネントは内部でuseClockDisplayフックを使用して、
 * 1秒ごとに時刻を更新します。親コンポーネントの再レンダリングを
 * 防ぐため、時計の状態はこのコンポーネント内で完結しています。
 */
export const ClockDisplay = memo(() => {
  const clockState = useClockDisplay();
  const isClockError = clockState.status === "error";

  if (isClockError) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 font-medium text-amber-700 text-sm">
        {clockState.displayText}
      </p>
    );
  }

  const timeText = clockState.isoNow
    ? formatClockTime(clockState.isoNow)
    : clockState.displayText;
  const dateText = clockState.isoNow
    ? formatClockDate(clockState.isoNow)
    : null;

  return (
    <>
      <div className="flex items-center gap-2 font-bold text-3xl text-primary tracking-tight drop-shadow-sm md:text-4xl">
        <Clock
          aria-hidden="true"
          className="h-8 w-8 text-primary/70 md:h-9 md:w-9"
        />
        {timeText}
      </div>
      {dateText ? (
        <p className="text-muted-foreground text-xs">{dateText}</p>
      ) : null}
    </>
  );
});

ClockDisplay.displayName = "ClockDisplay";
