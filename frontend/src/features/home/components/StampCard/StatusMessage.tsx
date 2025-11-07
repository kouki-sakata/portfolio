import { CardDescription } from "@/components/ui/card";
import type { StampStatus } from "@/features/home/hooks/useStamp";
import { formatClockTime } from "@/features/home/lib/clockFormat";
import { cn } from "@/lib/utils";

const statusClassMap: Record<StampStatus["result"], string> = {
  success: "text-emerald-600",
  conflict: "text-amber-600",
  error: "text-destructive",
};

const getTimeDisplay = (status: StampStatus): string | null => {
  if (status.result === "success" || status.result === "conflict") {
    try {
      return formatClockTime(status.submittedAt);
    } catch {
      return null;
    }
  }
  return null;
};

type StatusMessageProps = {
  status: StampStatus;
};

export const StatusMessage = ({ status }: StatusMessageProps) => {
  const timeDisplay = getTimeDisplay(status);

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
