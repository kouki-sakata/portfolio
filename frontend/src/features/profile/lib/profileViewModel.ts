import type {
  ProfileActivityResponse,
  ProfileMetadataDto,
  ProfileResponse,
} from "@/features/profile/api/profileApi";
import type {
  ExtendedProfileOverviewViewModel,
  ProfileActivityEntryViewModel,
  ProfileMetadataFormValues,
} from "@/features/profile/types";

const toNullable = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const toWorkStyle = (
  value: string | null | undefined
): "remote" | "hybrid" | "onsite" => {
  const normalized = (value ?? "onsite").toLowerCase();
  if (
    normalized === "remote" ||
    normalized === "hybrid" ||
    normalized === "onsite"
  ) {
    return normalized;
  }
  return "onsite";
};

const toStatus = (
  value: string | null | undefined
): "active" | "leave" | "inactive" => {
  const normalized = (value ?? "active").toLowerCase();
  if (normalized === "leave" || normalized === "inactive") {
    return normalized;
  }
  return "active";
};

export const createOverviewViewModel = (
  response: ProfileResponse
): ExtendedProfileOverviewViewModel => {
  const { employee, metadata } = response;
  return {
    fullName: employee.fullName,
    email: employee.email,
    employeeNumber: toNullable(metadata.employeeNumber),
    department: toNullable(metadata.department),
    address: toNullable(metadata.address),
    updatedAt: employee.updatedAt,
    activityNote: toNullable(metadata.activityNote),
    status: toStatus(metadata.status),
    joinedAt: metadata.joinedAt || "",
    manager: toNullable(metadata.manager),
    workStyle: toWorkStyle(metadata.workStyle),
    schedule: {
      start: metadata.schedule.start,
      end: metadata.schedule.end,
      breakMinutes: metadata.schedule.breakMinutes,
    },
    location: metadata.location || "",
    avatarUrl: metadata.avatarUrl || undefined,
  };
};

export const createMetadataFormValues = (
  metadata: ProfileMetadataDto
): ProfileMetadataFormValues => ({
  address: metadata.address ?? "",
  department: metadata.department ?? "",
  employeeNumber: metadata.employeeNumber ?? "",
  activityNote: metadata.activityNote ?? "",
  location: metadata.location ?? "",
  manager: metadata.manager ?? "",
  workStyle: toWorkStyle(metadata.workStyle),
  scheduleStart: metadata.schedule.start ?? "",
  scheduleEnd: metadata.schedule.end ?? "",
  scheduleBreakMinutes: metadata.schedule.breakMinutes ?? 0,
});

export const createActivityViewModel = (
  response: ProfileActivityResponse
): { entries: ProfileActivityEntryViewModel[]; totalCount: number } => {
  const entries = response.items.map<ProfileActivityEntryViewModel>((item) => ({
    id: item.id,
    occurredAt: item.occurredAt,
    actor: item.actor,
    operationType: item.operationType === "VIEW" ? "VIEW" : "UPDATE",
    summary: item.summary,
    changedFields: item.changedFields ?? [],
    beforeSnapshot: normalizeSnapshot(item.beforeSnapshot),
    afterSnapshot: normalizeSnapshot(item.afterSnapshot),
  }));
  return {
    entries,
    totalCount: response.totalElements,
  };
};

const normalizeSnapshot = (
  snapshot: Record<string, string | null> | undefined
): Record<string, string | null> => {
  if (!snapshot) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(snapshot).map(([key, value]) => [
      key,
      toNullable(value ?? undefined),
    ])
  );
};
