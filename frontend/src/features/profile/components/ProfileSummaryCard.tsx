import { AlertCircle, CalendarCheck, Clock } from "lucide-react";
import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MiniStat } from "@/features/profile/components/MiniStat";
import type { AttendanceSummaryViewModel } from "@/features/profile/types";
import { cn } from "@/shared/utils/cn";

export type ProfileSummaryCardProps = {
  summary: AttendanceSummaryViewModel | null;
  loading?: boolean;
  className?: string;
};

const ProfileSummaryCardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card className="p-4" key={`skeleton-${i}`}>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
          </Card>
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

export const ProfileSummaryCard = ({
  className,
  loading,
  summary,
}: ProfileSummaryCardProps) => {
  const chartData = useMemo(() => {
    if (!summary) {
      return [];
    }
    return summary.trendData.map((d) => ({
      month: `${d.month}月`,
      totalHours: d.totalHours,
      overtimeHours: d.overtimeHours,
    }));
  }, [summary]);

  if (loading) {
    return <ProfileSummaryCardSkeleton />;
  }

  if (!summary) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-center text-muted-foreground text-sm">
            統計データがありません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn("shadow-sm", className)}
      data-testid="profile-summary-card"
    >
      <CardHeader>
        <CardTitle>勤怠サマリ</CardTitle>
        <CardDescription>直近6か月の推移と今月の統計</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MiniStat
            icon={Clock}
            title="月間総労働"
            value={`${summary.currentMonth.totalHours}h`}
            variant="primary"
          />
          <MiniStat
            icon={AlertCircle}
            title="月間残業"
            value={`${summary.currentMonth.overtimeHours}h`}
            variant="warning"
          />
          <MiniStat
            icon={AlertCircle}
            title="遅刻回数"
            value={summary.currentMonth.lateCount}
            variant={
              summary.currentMonth.lateCount === 0 ? "success" : "warning"
            }
          />
          <MiniStat
            icon={CalendarCheck}
            title="有給消化"
            value={`${summary.currentMonth.paidLeaveHours}h`}
            variant="info"
          />
        </div>

        <div
          aria-label="直近6か月の勤怠トレンドグラフ"
          className="h-64"
          role="img"
        >
          <ResponsiveContainer height="100%" width="100%">
            <LineChart
              data={chartData}
              margin={{ bottom: 5, left: 0, right: 20, top: 5 }}
            >
              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
                strokeOpacity={0.3}
              />
              <XAxis
                axisLine={{ stroke: "hsl(var(--border))" }}
                dataKey="month"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                axisLine={{ stroke: "hsl(var(--border))" }}
                label={{
                  angle: -90,
                  position: "insideLeft",
                  value: "時間(h)",
                }}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend iconType="line" wrapperStyle={{ fontSize: 12 }} />
              <Line
                activeDot={{ r: 6 }}
                dataKey="totalHours"
                dot={{ r: 4 }}
                name="総労働時間"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                type="monotone"
              />
              <Line
                activeDot={{ r: 6 }}
                dataKey="overtimeHours"
                dot={{ r: 4 }}
                name="残業時間"
                stroke="hsl(25 95% 53%)"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
