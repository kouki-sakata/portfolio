import { describe, expect, it } from "vitest";

import {
  createActivityViewModel,
  createMetadataFormValues,
  createOverviewViewModel,
} from "./profileViewModel";

const profileResponse = {
  employee: {
    id: 5,
    fullName: "坂田 晃輝",
    email: "sakata@example.com",
    admin: false,
    updatedAt: "2025-11-04T03:00:00Z",
  },
  metadata: {
    address: "大阪府大阪市北区梅田1-1-1",
    department: "プロダクト開発部",
    employeeNumber: "EMP-0005",
    activityNote: "React/Javaの担当。",
    location: "大阪/梅田 (JST)",
    manager: "田中 太郎",
    workStyle: "hybrid",
    schedule: {
      start: "09:30",
      end: "18:30",
      breakMinutes: 60,
    },
    status: "active",
    joinedAt: "2024-04-01",
    avatarUrl: "",
  },
};

const activityResponse = {
  page: 0,
  size: 20,
  totalPages: 1,
  totalElements: 1,
  items: [
    {
      id: "evt-1",
      occurredAt: "2025-11-04T09:00:00Z",
      actor: "坂田 晃輝",
      operationType: "UPDATE",
      summary: "住所を更新",
      changedFields: ["address"],
      beforeSnapshot: { address: "旧住所" },
      afterSnapshot: { address: "新住所" },
    },
  ],
};

describe("profileViewModel", () => {
  it("creates overview view model", () => {
    const result = createOverviewViewModel(profileResponse);

    expect(result.fullName).toBe("坂田 晃輝");
    expect(result.email).toBe("sakata@example.com");
    expect(result.department).toBe("プロダクト開発部");
    expect(result.schedule).toStrictEqual({
      start: "09:30",
      end: "18:30",
      breakMinutes: 60,
    });
  });

  it("creates metadata form values with fallbacks", () => {
    const result = createMetadataFormValues(profileResponse.metadata);
    expect(result.address).toBe("大阪府大阪市北区梅田1-1-1");
    expect(result.scheduleStart).toBe("09:30");
    expect(result.scheduleBreakMinutes).toBe(60);
  });

  it("creates activity view model", () => {
    const { entries, totalCount } = createActivityViewModel(activityResponse);

    expect(totalCount).toBe(1);
    expect(entries).toHaveLength(1);
    const first = entries[0]!;
    expect(first.operationType).toBe("UPDATE");
    expect(first.changedFields).toStrictEqual(["address"]);
  });
});
