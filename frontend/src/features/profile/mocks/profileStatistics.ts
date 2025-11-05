import type { ProfileStatisticsData } from "@/features/profile/types";

export const sampleStatistics: ProfileStatisticsData = {
  summary: {
    currentMonth: {
      totalHours: 165,
      overtimeHours: 10,
      lateCount: 0,
      paidLeaveHours: 8,
    },
    trendData: [
      { month: "05", totalHours: 160, overtimeHours: 5 },
      { month: "06", totalHours: 168, overtimeHours: 8 },
      { month: "07", totalHours: 155, overtimeHours: 3 },
      { month: "08", totalHours: 172, overtimeHours: 12 },
      { month: "09", totalHours: 162, overtimeHours: 7 },
      { month: "10", totalHours: 165, overtimeHours: 10 },
    ],
  },
  monthly: [
    {
      month: "2025-05",
      totalHours: 160,
      overtimeHours: 5,
      lateCount: 0,
      paidLeaveHours: 0,
    },
    {
      month: "2025-06",
      totalHours: 168,
      overtimeHours: 8,
      lateCount: 1,
      paidLeaveHours: 0,
    },
    {
      month: "2025-07",
      totalHours: 155,
      overtimeHours: 3,
      lateCount: 0,
      paidLeaveHours: 16,
    },
    {
      month: "2025-08",
      totalHours: 172,
      overtimeHours: 12,
      lateCount: 0,
      paidLeaveHours: 0,
    },
    {
      month: "2025-09",
      totalHours: 162,
      overtimeHours: 7,
      lateCount: 0,
      paidLeaveHours: 8,
    },
    {
      month: "2025-10",
      totalHours: 165,
      overtimeHours: 10,
      lateCount: 0,
      paidLeaveHours: 8,
    },
  ],
};
