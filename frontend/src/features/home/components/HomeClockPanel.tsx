import { AlertCircle, Clock } from "lucide-react";
import { memo } from "react";

import { useClockDisplay } from "@/features/home/hooks/useClockDisplay";
import { cn } from "@/lib/utils";

const variantClassMap: Record<
  "hero" | "card" | "compact",
  { container: string; text: string }
> = {
  hero: {
    container: "rounded-xl bg-blue-50 p-4 flex flex-col gap-1",
    text: "font-semibold text-2xl text-slate-900",
  },
  card: {
    container: "rounded-lg border border-slate-200 p-3 flex items-center gap-2",
    text: "font-medium text-base text-slate-800",
  },
  compact: {
    container: "flex items-center gap-2 text-sm text-slate-700",
    text: "font-medium",
  },
};

export type HomeClockPanelProps = {
  variant?: "hero" | "card" | "compact";
  className?: string;
};

/**
 * 時計パネルコンポーネント
 *
 * このコンポーネントは内部でuseClockDisplayフックを使用して、
 * 時刻を表示します。親コンポーネントの再レンダリングを防ぐため、
 * 時計の状態はこのコンポーネント内で完結しています。
 */
export const HomeClockPanel = memo(
  ({ variant = "hero", className }: HomeClockPanelProps) => {
    const state = useClockDisplay();
    const { container, text } = variantClassMap[variant];
    const isError = state.status === "error";

    return (
      <div
        aria-live="polite"
        className={cn(container, className)}
        data-testid="home-clock-panel"
        data-variant={variant}
      >
        <div className="flex items-center gap-2">
          {isError ? (
            <AlertCircle aria-hidden className="size-5 text-amber-500" />
          ) : (
            <Clock aria-hidden className="size-5 text-blue-500" />
          )}
          <p className={text}>{state.displayText}</p>
        </div>
      </div>
    );
  }
);

HomeClockPanel.displayName = "HomeClockPanel";
