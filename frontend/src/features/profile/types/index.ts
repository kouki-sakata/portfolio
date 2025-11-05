export type ProfileOverviewViewModel = {
  fullName: string;
  email: string;
  employeeNumber: string | null;
  department: string | null;
  address: string | null;
  updatedAt: string;
  activityNote: string | null;
};

export type ProfileMetadataFormValues = {
  address: string;
  department: string;
  employeeNumber: string;
  activityNote: string;
  location: string;
  manager: string;
  workStyle: WorkStyle;
  scheduleStart: string;
  scheduleEnd: string;
  scheduleBreakMinutes: number;
};

export type ProfileActivityEntryViewModel = {
  id: string;
  occurredAt: string;
  actor: string;
  operationType: "VIEW" | "UPDATE";
  summary: string;
  changedFields: string[];
  beforeSnapshot: Record<string, string | null>;
  afterSnapshot: Record<string, string | null>;
};

export type UserStatus = "active" | "leave" | "inactive";

export type WorkStyle = "remote" | "hybrid" | "onsite";

export type WorkSchedule = {
  start: string;
  end: string;
  breakMinutes: number;
};

export type ExtendedProfileOverviewViewModel = ProfileOverviewViewModel & {
  avatarUrl?: string;
  status: UserStatus;
  joinedAt: string;
  manager: string | null;
  workStyle: WorkStyle;
  schedule: WorkSchedule;
  location: string;
};

export type MonthlyTrendPoint = {
  month: string;
  totalHours: number;
  overtimeHours: number;
};

export type AttendanceSummaryViewModel = {
  currentMonth: {
    totalHours: number;
    overtimeHours: number;
    lateCount: number;
    paidLeaveHours: number;
  };
  trendData: MonthlyTrendPoint[];
};

export type MonthlyAttendanceViewModel = {
  month: string;
  totalHours: number;
  overtimeHours: number;
  lateCount: number;
  paidLeaveHours: number;
};

export type ProfileStatisticsData = {
  summary: AttendanceSummaryViewModel;
  monthly: MonthlyAttendanceViewModel[];
};
