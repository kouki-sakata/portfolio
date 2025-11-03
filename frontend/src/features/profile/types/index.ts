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
  manager?: string;
  workStyle: WorkStyle;
  schedule: WorkSchedule;
  location: string;
};
