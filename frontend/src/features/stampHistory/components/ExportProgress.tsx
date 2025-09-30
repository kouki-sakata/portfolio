import { Progress } from "@/components/ui/progress";
import type { ExportProgress as ExportProgressType } from "../types";

type ExportProgressProps = {
  progress: ExportProgressType;
};

const PHASE_LABELS: Record<ExportProgressType["phase"], string> = {
  preparing: "準備中",
  processing: "処理中",
  generating: "ファイル生成中",
  complete: "完了",
};

export const ExportProgress = ({ progress }: ExportProgressProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        {PHASE_LABELS[progress.phase]}
      </span>
      <span className="font-medium">{progress.percentage}%</span>
    </div>

    <Progress value={progress.percentage} />

    {progress.total > 0 && (
      <div className="text-center text-muted-foreground text-xs">
        {progress.current} / {progress.total} 件
      </div>
    )}
  </div>
);
