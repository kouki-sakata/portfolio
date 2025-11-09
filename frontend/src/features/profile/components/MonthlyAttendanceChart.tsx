import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_GRID_CONFIG } from "@/features/profile/constants/chartStyles";

type MonthlyAttendanceChartProps = {
  chartData: Array<{
    month: string;
    totalHours: number;
    overtimeHours: number;
    paidLeaveHours: number;
  }>;
};

export const MonthlyAttendanceChart = ({
  chartData,
}: MonthlyAttendanceChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState(() => ({
    width: typeof window === "undefined" ? 600 : 0,
    height: typeof window === "undefined" ? 224 : 0,
  }));

  useEffect(() => {
    if (typeof window === "undefined") {
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
  }, []); // 依存配列を空にして、マウント時のみ実行

  return (
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
          <Bar dataKey="overtimeHours" fill="hsl(25 95% 53%)" name="残業時間" />
          <Bar
            dataKey="paidLeaveHours"
            fill="hsl(142 76% 36%)"
            name="有給消化"
          />
        </BarChart>
      ) : null}
    </div>
  );
};
