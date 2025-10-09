import type { Page, Route } from "@playwright/test";

import type { EmployeeSummary } from "@/features/auth/types";
import type {
  HomeDashboardResponse,
  StampRequest,
  StampResponse,
} from "@/features/home/types";
import type { NewsItem } from "@/features/news/types";
import type { FeatureFlags } from "@/shared/hooks/use-feature-flag";

const DEFAULT_ADMIN_USER: EmployeeSummary = {
  id: 1,
  firstName: "太郎",
  lastName: "山田",
  email: "admin.user@example.com",
  admin: true,
};

const DEFAULT_STAMP_RESPONSE: StampResponse = {
  message: "打刻が完了しました",
  success: true,
};

const DEFAULT_HOME_DASHBOARD: HomeDashboardResponse = {
  employee: DEFAULT_ADMIN_USER,
  news: [
    {
      id: 1,
      content: "本日の社内ミーティングは10:00に開始します。",
      newsDate: new Date().toISOString(),
      released: true,
    },
  ],
};

type LoginFailureConfig = {
  status?: number;
  message?: string;
};

type CreateAppMockServerOptions = {
  user?: EmployeeSummary;
  initialSessionAuthenticated?: boolean;
  initialEmployees?: EmployeeSummary[];
  homeDashboard?: HomeDashboardResponse;
  stampResponse?: StampResponse;
  featureFlags?: Partial<FeatureFlags>;
  initialNewsItems?: NewsItem[];
};

type ErrorSimulation = {
  endpoint: string;
  method: string;
  status: number;
  message?: string;
};

type AxiosPayload<T> = {
  data?: T;
};

const getAxiosPayload = <T>(body: unknown, raw?: string): T | undefined => {
  if (typeof body !== "object" || body === null) {
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AxiosPayload<T> | T;
        if (parsed && typeof parsed === "object" && "data" in parsed) {
          return (parsed as AxiosPayload<T>).data;
        }
        return parsed as T;
      } catch {
        return;
      }
    }
    return;
  }

  const candidate = body as AxiosPayload<T>;
  if (candidate.data !== undefined) {
    return candidate.data;
  }
  return body as T;
};

const buildJsonResponse = <T>(body: T) => ({
  body: JSON.stringify(body),
  headers: {
    "content-type": "application/json",
  },
});

const parseIdFromPath = (pathname: string): number | null => {
  const segments = pathname.split("/");
  const lastSegment = segments.at(-1);
  if (!lastSegment) {
    return null;
  }

  const parsed = Number.parseInt(lastSegment, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const createHomeDashboardResponse = (
  dashboard: HomeDashboardResponse,
  user: EmployeeSummary
): HomeDashboardResponse => ({
  employee: {
    ...user,
  },
  news: dashboard.news,
});

const DEFAULT_FLAGS: FeatureFlags = {
  useShadcnUI: false,
};

export class AppMockServer {
  private readonly page: Page;

  readonly user: EmployeeSummary;
  private readonly featureFlags: Partial<FeatureFlags>;

  private authenticated: boolean;

  private loginFailure: LoginFailureConfig | null = null;

  private readonly homeDashboard: HomeDashboardResponse;

  private readonly stampResponse: StampResponse;

  private lastStampRequest: StampRequest | null = null;

  private employees: EmployeeSummary[];

  private nextEmployeeId: number;

  private newsItems: NewsItem[];

  private nextNewsId: number;

  private errorSimulations: ErrorSimulation[] = [];

  constructor(page: Page, options: CreateAppMockServerOptions = {}) {
    this.page = page;
    this.user = options.user ?? { ...DEFAULT_ADMIN_USER };
    this.featureFlags = options.featureFlags ?? {};
    this.authenticated = options.initialSessionAuthenticated ?? false;
    this.homeDashboard = createHomeDashboardResponse(
      options.homeDashboard ?? DEFAULT_HOME_DASHBOARD,
      this.user
    );
    this.stampResponse = options.stampResponse ?? DEFAULT_STAMP_RESPONSE;

    const employees = options.initialEmployees ?? [
      {
        id: 2,
        firstName: "次郎",
        lastName: "佐藤",
        email: "jiro.sato@example.com",
        admin: false,
      },
    ];

    this.employees = employees.map((employee) => ({ ...employee }));
    const maxEmployeeId = this.employees.reduce(
      (max, employee) => (employee.id > max ? employee.id : max),
      this.user.id
    );
    this.nextEmployeeId = maxEmployeeId + 1;

    const newsItems = options.initialNewsItems ?? [];
    this.newsItems = newsItems.map((item) => ({ ...item }));
    const maxNewsId = this.newsItems.reduce(
      (max, item) => (item.id > max ? item.id : max),
      0
    );
    this.nextNewsId = maxNewsId + 1;
  }

  async prime() {
    const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
    await this.page.context().addCookies([
      {
        name: "XSRF-TOKEN",
        value: "mock-xsrf-token",
        url: baseUrl,
        sameSite: "Lax",
      },
      {
        name: "featureFlags",
        value: JSON.stringify({ ...DEFAULT_FLAGS, ...this.featureFlags }),
        url: baseUrl,
        sameSite: "Lax",
      },
    ]);

    await this.page.route("**/api/**", async (route) => {
      await this.handleRoute(route);
    });
  }

  setLoginFailure(failure: LoginFailureConfig | null) {
    this.loginFailure = failure;
  }

  getEmployees(): EmployeeSummary[] {
    return this.employees.map((employee) => ({ ...employee }));
  }

  getLastStampRequest(): StampRequest | null {
    return this.lastStampRequest ? { ...this.lastStampRequest } : null;
  }

  getNewsItems(): NewsItem[] {
    return this.newsItems.map((item) => ({ ...item }));
  }

  setNewsItems(items: NewsItem[]) {
    this.newsItems = items.map((item) => ({ ...item }));
  }

  setErrorSimulation(simulation: ErrorSimulation | null) {
    if (simulation === null) {
      this.errorSimulations = [];
    } else {
      this.errorSimulations = [simulation];
    }
  }

  addErrorSimulation(simulation: ErrorSimulation) {
    this.errorSimulations.push(simulation);
  }

  clearErrorSimulations() {
    this.errorSimulations = [];
  }

  /**
   * 特定のエンドポイントにリクエスト遅延を設定
   * @param endpoint APIエンドポイント (例: "/auth/login")
   * @param delayMs 遅延時間（ミリ秒）
   */
  setRequestDelay(endpoint: string, delayMs: number) {
    // 既存のルートをオーバーライドして遅延を追加
    this.page.route(`**/api${endpoint}`, async (route) => {
      // 指定された時間だけ遅延
      await new Promise(resolve => setTimeout(resolve, delayMs));
      // 元のハンドラーに処理を委譲
      await this.handleRoute(route);
    });
  }

  private async handleRoute(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;
    const method = request.method().toUpperCase();

    let normalizedPath = pathname;
    while (normalizedPath.startsWith("/api/")) {
      normalizedPath = normalizedPath.slice(4);
      if (!normalizedPath.startsWith("/")) {
        normalizedPath = `/${normalizedPath}`;
      }
    }

    // Check error simulations
    const errorSim = this.errorSimulations.find(
      (sim) => normalizedPath.startsWith(sim.endpoint) && sim.method === method
    );
    if (errorSim) {
      // Handle network errors (status 0) by aborting the request
      if (errorSim.status === 0) {
        await route.abort("failed");
        return;
      }

      await route.fulfill({
        status: errorSim.status,
        ...buildJsonResponse({
          message: errorSim.message ?? "Simulated error",
        }),
      });
      return;
    }

    if (normalizedPath === "/auth/session" && method === "GET") {
      await route.fulfill(
        buildJsonResponse({
          authenticated: this.authenticated,
          employee: this.authenticated ? this.user : null,
        })
      );
      return;
    }

    if (normalizedPath === "/auth/login" && method === "POST") {
      if (this.loginFailure) {
        const { status = 401, message = "Unauthorized" } = this.loginFailure;
        this.loginFailure = null;
        await route.fulfill({
          status,
          ...buildJsonResponse({ message }),
        });
        return;
      }

      this.authenticated = true;
      await route.fulfill(buildJsonResponse({ employee: this.user }));
      return;
    }

    if (normalizedPath === "/auth/logout" && method === "POST") {
      this.authenticated = false;
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (normalizedPath === "/home/overview" && method === "GET") {
      await route.fulfill(buildJsonResponse(this.homeDashboard));
      return;
    }

    if (normalizedPath === "/home/stamps" && method === "POST") {
      const payload = request.postDataJSON() as StampRequest;
      this.lastStampRequest = { ...payload };
      await route.fulfill(buildJsonResponse(this.stampResponse));
      return;
    }

    if (normalizedPath === "/employees" && method === "GET") {
      await route.fulfill(buildJsonResponse({ employees: this.employees }));
      return;
    }

    if (normalizedPath === "/employees" && method === "POST") {
      const payload = getAxiosPayload<EmployeeSummary>(
        request.postDataJSON(),
        request.postData()
      );
      if (!payload) {
        await route.fulfill({ status: 400, body: "" });
        return;
      }

      // Check for duplicate email
      const emailExists = this.employees.some(
        (emp) => emp.email.toLowerCase() === payload.email?.toLowerCase()
      );

      // Also check against the authenticated user's email
      const isUserEmail =
        this.user.email.toLowerCase() === payload.email?.toLowerCase();

      if (emailExists || isUserEmail) {
        await route.fulfill({
          status: 409,
          ...buildJsonResponse({
            message: "このメールアドレスは既に使用されています",
          }),
        });
        return;
      }

      const newEmployee: EmployeeSummary = {
        ...payload,
        id: this.nextEmployeeId,
      };
      this.nextEmployeeId += 1;
      this.employees = [...this.employees, newEmployee];

      await route.fulfill({
        status: 201,
        ...buildJsonResponse(newEmployee),
      });
      return;
    }

    if (normalizedPath.startsWith("/employees/") && method === "PUT") {
      const employeeId = parseIdFromPath(normalizedPath);
      if (!employeeId) {
        await route.fulfill({ status: 400, body: "" });
        return;
      }

      const payload = getAxiosPayload<Partial<EmployeeSummary>>(
        request.postDataJSON(),
        request.postData()
      );
      if (!payload) {
        await route.fulfill({ status: 400, body: "" });
        return;
      }

      const index = this.employees.findIndex(
        (employee) => employee.id === employeeId
      );
      if (index < 0) {
        await route.fulfill({ status: 404, body: "" });
        return;
      }

      const updatedEmployee: EmployeeSummary = {
        ...this.employees[index],
        ...payload,
        id: employeeId,
      };
      this.employees = [
        ...this.employees.slice(0, index),
        updatedEmployee,
        ...this.employees.slice(index + 1),
      ];

      await route.fulfill(buildJsonResponse(updatedEmployee));
      return;
    }

    if (normalizedPath === "/employees" && method === "DELETE") {
      const payload = getAxiosPayload<{ ids: number[] }>(
        request.postDataJSON(),
        request.postData()
      );
      const ids = payload?.ids ?? [];
      const targetIds = new Set(ids);
      this.employees = this.employees.filter(
        (employee) => !targetIds.has(employee.id)
      );
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (normalizedPath === "/stamp-history" && method === "GET") {
      const currentYear = new Date().getFullYear().toString();
      const currentMonth = (new Date().getMonth() + 1).toString();

      await route.fulfill(
        buildJsonResponse({
          year: currentYear,
          month: currentMonth,
          years: [
            currentYear,
            (Number.parseInt(currentYear, 10) - 1).toString(),
          ],
          months: Array.from({ length: 12 }, (_, i) => (i + 1).toString()),
          entries: [],
          summary: {
            totalWorkingDays: 0,
            totalWorkingHours: 0,
            averageWorkingHours: 0,
            presentDays: 0,
            absentDays: 0,
          },
        })
      );
      return;
    }

    // News endpoints
    if (normalizedPath === "/news" && method === "GET") {
      await route.fulfill(
        buildJsonResponse({
          items: this.newsItems,
          total: this.newsItems.length,
          page: 1,
          pageSize: 50,
        })
      );
      return;
    }

    if (normalizedPath === "/news" && method === "POST") {
      const payload = getAxiosPayload<Omit<NewsItem, "id">>(
        request.postDataJSON(),
        request.postData()
      );
      if (!payload) {
        await route.fulfill({ status: 400, body: "" });
        return;
      }

      const newItem: NewsItem = {
        ...payload,
        id: this.nextNewsId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: this.user.id,
      };
      this.nextNewsId += 1;
      this.newsItems = [...this.newsItems, newItem];

      await route.fulfill({
        status: 201,
        ...buildJsonResponse(newItem),
      });
      return;
    }

    if (normalizedPath.startsWith("/news/") && method === "PUT") {
      const newsId = parseIdFromPath(normalizedPath);
      if (!newsId) {
        await route.fulfill({ status: 400, body: "" });
        return;
      }

      const payload = getAxiosPayload<Partial<NewsItem>>(
        request.postDataJSON(),
        request.postData()
      );
      if (!payload) {
        await route.fulfill({ status: 400, body: "" });
        return;
      }

      const index = this.newsItems.findIndex((item) => item.id === newsId);
      if (index < 0) {
        await route.fulfill({ status: 404, body: "" });
        return;
      }

      const updatedItem: NewsItem = {
        ...this.newsItems[index],
        ...payload,
        id: newsId,
        updatedAt: new Date().toISOString(),
      };
      this.newsItems = [
        ...this.newsItems.slice(0, index),
        updatedItem,
        ...this.newsItems.slice(index + 1),
      ];

      await route.fulfill(buildJsonResponse(updatedItem));
      return;
    }

    if (normalizedPath.startsWith("/news/") && method === "DELETE") {
      const newsId = parseIdFromPath(normalizedPath);
      if (!newsId) {
        await route.fulfill({ status: 400, body: "" });
        return;
      }

      this.newsItems = this.newsItems.filter((item) => item.id !== newsId);
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (
      normalizedPath.startsWith("/news/") &&
      normalizedPath.endsWith("/status") &&
      method === "PATCH"
    ) {
      const segments = normalizedPath.split("/");
      const newsId = Number.parseInt(segments[2] ?? "", 10);
      if (Number.isNaN(newsId)) {
        await route.fulfill({ status: 400, body: "" });
        return;
      }

      const payload = getAxiosPayload<{ published: boolean }>(
        request.postDataJSON(),
        request.postData()
      );
      if (!payload) {
        await route.fulfill({ status: 400, body: "" });
        return;
      }

      const index = this.newsItems.findIndex((item) => item.id === newsId);
      if (index < 0) {
        await route.fulfill({ status: 404, body: "" });
        return;
      }

      const updatedItem: NewsItem = {
        ...this.newsItems[index],
        published: payload.published,
        updatedAt: new Date().toISOString(),
      };
      this.newsItems = [
        ...this.newsItems.slice(0, index),
        updatedItem,
        ...this.newsItems.slice(index + 1),
      ];

      await route.fulfill({ status: 204, body: "" });
      return;
    }

    // Logs endpoints
    if (normalizedPath === "/logs" && method === "GET") {
      await route.fulfill(
        buildJsonResponse({
          logs: [],
          total: 0,
          page: 1,
          pageSize: 50,
        })
      );
      return;
    }

    if (normalizedPath === "/logs/export" && method === "GET") {
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "text/csv",
        },
        body: "id,timestamp,level,message\n",
      });
      return;
    }

    await route.fallback();
  }
}

export const createAppMockServer = async (
  page: Page,
  options?: CreateAppMockServerOptions
) => {
  const server = new AppMockServer(page, options);
  await server.prime();
  return server;
};
