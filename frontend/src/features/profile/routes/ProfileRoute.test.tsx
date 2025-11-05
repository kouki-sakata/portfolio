import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import type {
  ProfileActivityResponse,
  ProfileResponse,
} from "@/features/profile/api/profileApi";
import { mswServer } from "@/test/msw/server";
import { TestAuthProvider } from "@/test/test-utils";
import { ProfileRoute } from "./ProfileRoute";

const overviewResponse: ProfileResponse = {
  employee: {
    id: 9000,
    fullName: "坂田 晃輝",
    email: "profile@example.com",
    admin: false,
    updatedAt: "2025-11-04T03:00:00Z",
  },
  metadata: {
    address: "大阪府大阪市北区梅田1-1-1",
    department: "プロダクト開発部",
    employeeNumber: "EMP-9000",
    activityNote: "React/Javaの担当。フロントとバックの橋渡し。",
    location: "大阪/梅田",
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

const updatedOverviewResponse: ProfileResponse = {
  ...overviewResponse,
  metadata: {
    ...overviewResponse.metadata,
    department: "DX推進室",
    location: "東京/丸の内",
    schedule: {
      start: "10:00",
      end: "19:00",
      breakMinutes: 45,
    },
  },
  employee: {
    ...overviewResponse.employee,
    updatedAt: "2025-11-04T03:30:00Z",
  },
};

const activityResponse: ProfileActivityResponse = {
  page: 0,
  size: 5,
  totalPages: 1,
  totalElements: 1,
  items: [
    {
      id: "evt-1",
      occurredAt: "2025-11-04T09:00:00Z",
      actor: "坂田 晃輝",
      operationType: "UPDATE",
      summary: "部署を更新",
      changedFields: ["department"],
      beforeSnapshot: { department: "プロダクト開発部" },
      afterSnapshot: { department: "DX推進室" },
    },
  ],
};

describe("ProfileRoute", () => {
  let lastPatchPayload: Record<string, unknown> | null = null;
  let currentOverview: ProfileResponse;

  beforeEach(() => {
    mswServer.resetHandlers();
    lastPatchPayload = null;
    currentOverview = overviewResponse;
    mswServer.use(
      http.get("http://localhost/api/profile/me", () =>
        HttpResponse.json(currentOverview)
      ),
      http.get("http://localhost/api/profile/me/activity", ({ request }) => {
        const url = new URL(request.url);
        const page = Number.parseInt(url.searchParams.get("page") ?? "0", 10);
        if (page === 0) {
          return HttpResponse.json(activityResponse);
        }
        return HttpResponse.json({ ...activityResponse, items: [] });
      }),
      http.patch(
        "http://localhost/api/profile/me/metadata",
        async ({ request }) => {
          lastPatchPayload = (await request.json()) as Record<string, unknown>;
          currentOverview = updatedOverviewResponse;
          return HttpResponse.json(updatedOverviewResponse);
        }
      )
    );
  });

  it("プロフィール情報を取得し、編集後に更新値を表示する", async () => {
    const user = userEvent.setup();

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <TestAuthProvider useMemoryRouter>{children}</TestAuthProvider>
      </QueryClientProvider>
    );

    render(<ProfileRoute />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "ユーザ情報" })).toBeVisible()
    );

    const departmentLabels = await screen.findAllByText("プロダクト開発部", {
      exact: false,
    });
    expect(departmentLabels[0]).toBeVisible();

    await user.click(screen.getByRole("button", { name: "編集" }));

    const sheet = await screen.findByRole("dialog", {
      name: "プロフィール編集",
    });
    const departmentInput = within(sheet).getByLabelText("部署");
    await user.clear(departmentInput);
    await user.type(departmentInput, "DX推進室");
    await user.click(within(sheet).getByRole("button", { name: "保存" }));

    await waitFor(() => expect(lastPatchPayload).not.toBeNull());
    await waitFor(() => {
      const cached = queryClient.getQueryData<any>(["profile", "overview"]);
      expect(cached?.overview?.department).toBe("DX推進室");
    });
    await waitFor(() =>
      expect(screen.getByTestId("profile-overview-card").textContent).toContain(
        "DX推進室"
      )
    );

    await user.click(screen.getByRole("button", { name: "編集" }));
    const updatedSheet = await screen.findByRole("dialog", {
      name: "プロフィール編集",
    });
    const departmentInputAfter = within(updatedSheet).getByLabelText(
      "部署"
    ) as HTMLInputElement;
    expect(departmentInputAfter.value).toBe("DX推進室");
    await user.click(
      within(updatedSheet).getByRole("button", { name: "キャンセル" })
    );

    const activitySummaries = await screen.findAllByText("部署を更新", {
      exact: false,
    });
    expect(activitySummaries.length).toBeGreaterThan(0);
    expect(activitySummaries[0]).toBeInTheDocument();

    expect(lastPatchPayload).toMatchObject({ department: "DX推進室" });
  });
});
