import type { PaginationState } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { ProfilePage } from "@/features/profile/components/ProfilePage";
import {
  sampleActivity,
  sampleMetadata,
  sampleOverview,
} from "@/features/profile/mocks/fixtures";
import type {
  ExtendedProfileOverviewViewModel,
  ProfileActivityEntryViewModel,
  ProfileMetadataFormValues,
} from "@/features/profile/types";

const FIELD_LABEL: Record<keyof ProfileMetadataFormValues, string> = {
  address: "住所",
  department: "部署",
  employeeNumber: "社員番号",
  activityNote: "活動メモ",
  location: "勤務地",
  manager: "上長",
  workStyle: "勤務形態",
  scheduleStart: "始業時刻",
  scheduleEnd: "終業時刻",
  scheduleBreakMinutes: "休憩時間",
};

const toNullable = (value: string | number): string | null => {
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : null;
};

const generateActivityEntry = (
  actor: string,
  before: ProfileMetadataFormValues,
  after: ProfileMetadataFormValues
): ProfileActivityEntryViewModel | null => {
  const changedFields: Array<keyof ProfileMetadataFormValues> = [];
  const beforeSnapshot: Record<string, string | null> = {};
  const afterSnapshot: Record<string, string | null> = {};

  for (const key of Object.keys(before) as Array<
    keyof ProfileMetadataFormValues
  >) {
    const previous = toNullable(before[key]);
    const next = toNullable(after[key]);

    if (previous !== next) {
      changedFields.push(key);
      beforeSnapshot[key] = previous;
      afterSnapshot[key] = next;
    }
  }

  if (changedFields.length === 0) {
    return null;
  }

  const summary = `${changedFields
    .map((field) => FIELD_LABEL[field])
    .join("・")}を更新`;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}`;

  const now = new Date().toISOString();

  return {
    id,
    occurredAt: now,
    actor,
    operationType: "UPDATE",
    summary,
    changedFields: changedFields.map((field) => field as string),
    beforeSnapshot,
    afterSnapshot,
  };
};

export const ProfileRoute = () => {
  const [overview, setOverview] =
    useState<ExtendedProfileOverviewViewModel | null>(sampleOverview);
  const [metadata, setMetadata] =
    useState<ProfileMetadataFormValues>(sampleMetadata);
  const [activityEntries, setActivityEntries] =
    useState<ProfileActivityEntryViewModel[]>(sampleActivity);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  const paginatedEntries = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return activityEntries.slice(start, end);
  }, [activityEntries, pagination.pageIndex, pagination.pageSize]);

  const handleMetadataSubmit = (values: ProfileMetadataFormValues) => {
    setMetadata(values);

    if (overview) {
      const now = new Date().toISOString();
      setOverview({
        ...overview,
        employeeNumber: toNullable(values.employeeNumber),
        department: toNullable(values.department),
        address: toNullable(values.address),
        activityNote: toNullable(values.activityNote),
        location: values.location,
        manager: toNullable(values.manager),
        workStyle: values.workStyle,
        schedule: {
          start: values.scheduleStart,
          end: values.scheduleEnd,
          breakMinutes: values.scheduleBreakMinutes,
        },
        updatedAt: now,
      });
    }

    const entry = generateActivityEntry(
      overview?.fullName ?? "不明なユーザー",
      metadata,
      values
    );

    if (entry) {
      setActivityEntries((prev) => [entry, ...prev]);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  };

  return (
    <ProfilePage
      activity={{
        entries: paginatedEntries,
        loading: false,
        page: pagination.pageIndex,
        pageSize: pagination.pageSize,
        totalCount: activityEntries.length,
      }}
      metadata={metadata}
      onActivityPageChange={(state) => {
        setPagination(state);
      }}
      onMetadataSubmit={handleMetadataSubmit}
      overview={overview}
    />
  );
};
