import type {
  ProfileActivityEntryViewModel,
  ProfileMetadataFormValues,
  ProfileOverviewViewModel,
} from "@/features/profile/types";

export const sampleOverview: ProfileOverviewViewModel = {
  fullName: "坂田 晃輝",
  email: "sakata@example.com",
  employeeNumber: "EMP-0001",
  department: "プロダクト開発部",
  address: "大阪府大阪市北区梅田1-1-1",
  updatedAt: "2025-11-02T12:34:56+09:00",
  activityNote: "React/Javaの担当。フロントとバックの橋渡し。",
};

export const sampleMetadata: ProfileMetadataFormValues = {
  address: sampleOverview.address ?? "",
  department: sampleOverview.department ?? "",
  employeeNumber: sampleOverview.employeeNumber ?? "",
  activityNote: sampleOverview.activityNote ?? "",
};

export const sampleActivity: ProfileActivityEntryViewModel[] = [
  {
    id: "1",
    occurredAt: "2025-11-02T09:30:00+09:00",
    actor: "坂田 晃輝",
    operationType: "UPDATE",
    summary: "活動メモを更新",
    changedFields: ["activityNote"],
    beforeSnapshot: {
      activityNote: "React/Javaの担当。フロントとバックの橋渡し。",
    },
    afterSnapshot: {
      activityNote: "React/Javaの担当。打刻リファクタリングを主導。",
    },
  },
  {
    id: "2",
    occurredAt: "2025-11-01T18:15:00+09:00",
    actor: "坂田 晃輝",
    operationType: "VIEW",
    summary: "プロフィールを閲覧",
    changedFields: [],
    beforeSnapshot: {},
    afterSnapshot: {},
  },
  {
    id: "3",
    occurredAt: "2025-10-28T10:05:00+09:00",
    actor: "田中 太郎",
    operationType: "UPDATE",
    summary: "部署を更新",
    changedFields: ["department"],
    beforeSnapshot: { department: "プロダクト開発部" },
    afterSnapshot: { department: "開発推進部" },
  },
];
