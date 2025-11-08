import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { calculateMonthlySummary } from "@/features/stampHistory/lib/summary";
import type {
  MonthlyStats,
  StampHistoryEntry,
} from "@/features/stampHistory/types";

type MonthlyStatsCardProps = {
  entries: StampHistoryEntry[];
  summary?: MonthlyStats;
};

export const MonthlyStatsCard = ({
  entries,
  summary,
}: MonthlyStatsCardProps) => {
  const stats = summary ?? calculateMonthlySummary(entries);
  const overtimeHours = Math.round((stats.totalOvertimeMinutes / 60) * 10) / 10;

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-semibold text-lg">月次統計</h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">総日数</span>
          <Badge className="justify-center py-2" variant="secondary">
            {stats.totalWorkingDays}日
          </Badge>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">出勤日数</span>
          <Badge className="justify-center py-2" variant="secondary">
            {stats.presentDays}日
          </Badge>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">欠勤日数</span>
          <Badge className="justify-center py-2" variant="secondary">
            {stats.absentDays}日
          </Badge>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">総勤務時間</span>
          <Badge className="justify-center py-2" variant="secondary">
            {stats.totalWorkingHours}h
          </Badge>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">平均勤務時間</span>
          <Badge className="justify-center py-2" variant="secondary">
            {stats.averageWorkingHours}h
          </Badge>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">残業合計</span>
          <Badge className="justify-center py-2" variant="secondary">
            {stats.totalOvertimeMinutes}分
            <span className="ml-1 text-muted-foreground text-xs">
              ({overtimeHours}h)
            </span>
          </Badge>
        </div>
      </div>
    </Card>
  );
};
