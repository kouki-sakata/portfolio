import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { StampHistoryEntry } from "@/features/stampHistory/types";

type MonthlyStatsCardProps = {
  entries: StampHistoryEntry[];
};

const calculateStats = (entries: StampHistoryEntry[]) => {
  let totalWorkingHours = 0;
  let presentDays = 0;

  for (const entry of entries) {
    if (entry.inTime && entry.outTime) {
      presentDays++;

      // HH:MM形式の時刻を分に変換
      const inTimeParts = entry.inTime.split(":");
      const [inHour = 0, inMin = 0] = [
        Number(inTimeParts[0] ?? 0),
        Number(inTimeParts[1] ?? 0),
      ];

      const outTimeParts = entry.outTime.split(":");
      const [outHour = 0, outMin = 0] = [
        Number(outTimeParts[0] ?? 0),
        Number(outTimeParts[1] ?? 0),
      ];

      const inMinutes = inHour * 60 + inMin;
      const outMinutes = outHour * 60 + outMin;

      // 勤務時間を計算（分単位）
      const workingMinutes = outMinutes - inMinutes;
      totalWorkingHours += workingMinutes / 60;
    }
  }

  const averageWorkingHours =
    presentDays > 0 ? totalWorkingHours / presentDays : 0;
  const totalWorkingDays = entries.length;
  const absentDays = totalWorkingDays - presentDays;

  return {
    totalWorkingDays,
    presentDays,
    absentDays,
    totalWorkingHours: Math.round(totalWorkingHours * 10) / 10,
    averageWorkingHours: Math.round(averageWorkingHours * 10) / 10,
  };
};

export const MonthlyStatsCard = ({ entries }: MonthlyStatsCardProps) => {
  const stats = calculateStats(entries);

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-semibold text-lg">月次統計</h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">総日数</span>
          <Badge className="justify-center py-2" variant="outline">
            {stats.totalWorkingDays}日
          </Badge>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">出勤日数</span>
          <Badge className="justify-center py-2" variant="default">
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
          <Badge className="justify-center py-2" variant="default">
            {stats.totalWorkingHours}h
          </Badge>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">平均勤務時間</span>
          <Badge className="justify-center py-2" variant="outline">
            {stats.averageWorkingHours}h
          </Badge>
        </div>
      </div>
    </Card>
  );
};
