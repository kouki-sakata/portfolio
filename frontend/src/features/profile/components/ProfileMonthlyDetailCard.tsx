import { AlertCircle, CalendarDays } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MonthlyAttendanceViewModel } from "@/features/profile/types";
import { cn } from "@/shared/utils/cn";

export type ProfileMonthlyDetailCardProps = {
  monthlyData: MonthlyAttendanceViewModel[];
  loading?: boolean;
  className?: string;
};

const ProfileMonthlyDetailCardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-6">
      <Skeleton className="h-56 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton className="h-12 w-full" key={`skeleton-${i}`} />
        ))}
      </div>
    </CardContent>
  </Card>
);

const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split("-");
  if (!(year && month)) {
    return monthStr;
  }
  return `${year}年${Number.parseInt(month, 10)}月`;
};

export const ProfileMonthlyDetailCard = ({
  className,
  loading,
  monthlyData,
}: ProfileMonthlyDetailCardProps) => {
  const chartData = useMemo(
    () =>
      monthlyData.map((d) => ({
        month: d.month.slice(5),
        totalHours: d.totalHours,
        overtimeHours: d.overtimeHours,
        paidLeaveHours: d.paidLeaveHours,
      })),
    [monthlyData]
  );

  if (loading) {
    return <ProfileMonthlyDetailCardSkeleton />;
  }

  if (monthlyData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-center text-muted-foreground text-sm">
            月次データがありません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn("shadow-sm", className)}
      data-testid="profile-monthly-detail-card"
    >
      <CardHeader>
        <CardTitle>月次詳細</CardTitle>
        <CardDescription>過去6か月の詳細データ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          aria-label="月次勤怠データのバーチャート"
          className="h-56"
          role="img"
        >
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
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
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="totalHours"
                fill="hsl(var(--primary))"
                name="総労働時間"
              />
              <Bar
                dataKey="overtimeHours"
                fill="hsl(25 95% 53%)"
                name="残業時間"
              />
              <Bar
                dataKey="paidLeaveHours"
                fill="hsl(142 76% 36%)"
                name="有給消化"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">
              月別勤怠サマリデータ。総労働時間、残業時間、遅刻回数、有給消化時間を含みます。
            </caption>
            <TableHeader>
              <TableRow>
                <TableHead>月</TableHead>
                <TableHead className="text-right">総労働(h)</TableHead>
                <TableHead className="text-right">残業(h)</TableHead>
                <TableHead className="text-right">遅刻回数</TableHead>
                <TableHead className="text-right">有給(h)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="font-medium">
                    {formatMonth(row.month)}
                  </TableCell>
                  <TableCell className="text-right">{row.totalHours}</TableCell>
                  <TableCell className="text-right">
                    {row.overtimeHours}
                  </TableCell>
                  <TableCell className="text-right">{row.lateCount}</TableCell>
                  <TableCell className="text-right">
                    {row.paidLeaveHours}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button className="rounded-2xl" variant="outline">
          <CalendarDays className="mr-2 h-4 w-4" />
          勤怠カレンダーを見る
        </Button>
      </CardFooter>
    </Card>
  );
};
