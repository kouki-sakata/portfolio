import { describe, expect, it } from "vitest";
import type { ProfileActivityResponse } from "@/features/profile/api/profileApi";
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

const activityResponse: ProfileActivityResponse = {
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
} satisfies ProfileActivityResponse;

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
    const first = entries[0];
    if (!first) {
      throw new Error("First entry is undefined");
    }
    expect(first.operationType).toBe("UPDATE");
    expect(first.changedFields).toStrictEqual(["address"]);
  });

  it("normalizes blanks and unknown work styles in overview", () => {
    const overview = createOverviewViewModel({
      ...profileResponse,
      metadata: {
        ...profileResponse.metadata,
        address: "  ",
        activityNote: "",
        workStyle: "unknown",
        status: "",
        manager: "",
      },
    });

    expect(overview.address).toBeNull();
    expect(overview.activityNote).toBeNull();
    expect(overview.workStyle).toBe("onsite");
    expect(overview.status).toBe("active");
    expect(overview.manager).toBeNull();
  });

  it("returns empty snapshots when activity detail is missing", () => {
    const baseItem = activityResponse.items[0];
    if (!baseItem) {
      throw new Error("activityResponse should contain at least one item");
    }

    const { entries } = createActivityViewModel({
      ...activityResponse,
      items: [
        {
          ...baseItem,
          beforeSnapshot: undefined as unknown as Record<string, string | null>,
          afterSnapshot: undefined as unknown as Record<string, string | null>,
          operationType: "unknown",
        },
      ],
    });
    const first = entries[0];
    expect(first?.beforeSnapshot).toEqual({});
    expect(first?.afterSnapshot).toEqual({});
    expect(first?.operationType).toBe("UPDATE");
  });
});
