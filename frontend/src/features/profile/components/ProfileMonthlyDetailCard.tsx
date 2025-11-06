import { AlertCircle, CalendarDays } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
import { CHART_GRID_CONFIG } from "@/features/profile/constants/chartStyles";
import type { MonthlyAttendanceViewModel } from "@/features/profile/types";
import { cn } from "@/shared/utils/cn";

export type ProfileMonthlyDetailCardProps = {
  monthlyData: MonthlyAttendanceViewModel[];
  loading?: boolean;
  className?: string;
};

const MONTHLY_DETAIL_SKELETON_KEYS = [
  "monthly-detail-skeleton-1",
  "monthly-detail-skeleton-2",
  "monthly-detail-skeleton-3",
  "monthly-detail-skeleton-4",
  "monthly-detail-skeleton-5",
] as const;

const ProfileMonthlyDetailCardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-6">
      <Skeleton className="h-56 w-full" />
      <div className="space-y-2">
        {MONTHLY_DETAIL_SKELETON_KEYS.map((key) => (
          <Skeleton className="h-12 w-full" key={key} />
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

const extractMonthForChart = (value: string): string => {
  const segments = value.split("-");
  return segments.at(-1) ?? value;
};

export const ProfileMonthlyDetailCard = ({
  className,
  loading,
  monthlyData,
}: ProfileMonthlyDetailCardProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState(() => ({
    width: typeof window === "undefined" ? 600 : 0,
    height: typeof window === "undefined" ? 224 : 0,
  }));

  useEffect(() => {
    if (typeof window === "undefined" || loading || monthlyData.length === 0) {
      return;
    }

    const element = chartContainerRef.current;
    if (!element) {
      return;
    }

    const update = () => {
      const rect = element.getBoundingClientRect();
      const measuredWidth = rect.width > 0 ? rect.width : element.clientWidth;
      const measuredHeight =
        rect.height > 0 ? rect.height : element.clientHeight;
      const nextWidth = measuredWidth > 0 ? measuredWidth : 600;
      const nextHeight = measuredHeight > 0 ? measuredHeight : 224;
      setChartSize({ width: nextWidth, height: nextHeight });
    };

    update();

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(() => update());
      observer.observe(element);
      return () => observer.disconnect();
    }

    const timeoutId = window.setTimeout(update, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loading, monthlyData]);

  const chartData = useMemo(
    () =>
      monthlyData.map((d) => ({
        month: extractMonthForChart(d.month),
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
      <CardContent className="min-w-0 space-y-6">
        <div
          aria-label="月次勤怠データのバーチャート"
          className="h-56 min-h-0 w-full min-w-0"
          ref={chartContainerRef}
          role="img"
        >
          {chartSize.width > 0 && chartSize.height > 0 ? (
            <BarChart
              data={chartData}
              height={chartSize.height}
              margin={{ bottom: 5, left: 0, right: 20, top: 5 }}
              width={chartSize.width}
            >
              <CartesianGrid {...CHART_GRID_CONFIG} />
              <XAxis
                axisLine={{ stroke: "hsl(var(--border))" }}
                dataKey="month"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
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
          ) : null}
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
