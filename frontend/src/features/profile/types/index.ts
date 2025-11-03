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
