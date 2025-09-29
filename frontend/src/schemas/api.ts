import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const LoginRequest = z
  .object({ email: z.string().email(), password: z.string() })
  .strict()
  .passthrough();
const EmployeeSummaryResponse = z
  .object({
    id: z.number().int(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    admin: z.boolean(),
  })
  .strict()
  .passthrough();
const LoginResponse = z
  .object({ employee: EmployeeSummaryResponse })
  .strict()
  .passthrough();
const ErrorResponse = z
  .object({
    message: z.string(),
    details: z.object({}).partial().strict().passthrough().optional(),
  })
  .strict()
  .passthrough();
const SessionResponse = z
  .object({
    authenticated: z.boolean(),
    employee: EmployeeSummaryResponse.optional(),
  })
  .strict()
  .passthrough();
const EmployeeListResponse = z
  .object({ employees: z.array(EmployeeSummaryResponse) })
  .strict()
  .passthrough();
const EmployeeUpsertRequest = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    password: z.string().nullish(),
    admin: z.boolean(),
  })
  .strict()
  .passthrough();
const EmployeeDeleteRequest = z
  .object({ ids: z.array(z.number().int()) })
  .strict()
  .passthrough();
const HomeNewsItem = z
  .object({
    id: z.number().int(),
    content: z.string(),
    newsDate: z.string(),
    releaseFlag: z.boolean(),
  })
  .strict()
  .passthrough();
const HomeDashboardResponse = z
  .object({ employee: EmployeeSummaryResponse, news: z.array(HomeNewsItem) })
  .strict()
  .passthrough();
const StampRequest = z
  .object({
    stampTime: z.string().datetime({ offset: true }),
    stampType: z.enum(["1", "2"]),
    nightWorkFlag: z.enum(["0", "1"]),
  })
  .strict()
  .passthrough();
const StampResponse = z.object({ message: z.string() }).strict().passthrough();
const StampHistoryEntryResponse = z
  .object({
    id: z.number().int().nullable(),
    year: z.string().nullable(),
    month: z.string().nullable(),
    day: z.string().nullable(),
    dayOfWeek: z.string().nullable(),
    employeeId: z.number().int().nullable(),
    employeeName: z.string().nullable(),
    updateEmployeeName: z.string().nullable(),
    inTime: z.string().nullable(),
    outTime: z.string().nullable(),
    updateDate: z.string().nullable(),
  })
  .partial()
  .strict()
  .passthrough();
const StampHistoryResponse = z
  .object({
    year: z.string(),
    month: z.string(),
    years: z.array(z.string()),
    months: z.array(z.string()),
    entries: z.array(StampHistoryEntryResponse),
  })
  .strict()
  .passthrough();

export const schemas = {
  LoginRequest,
  EmployeeSummaryResponse,
  LoginResponse,
  ErrorResponse,
  SessionResponse,
  EmployeeListResponse,
  EmployeeUpsertRequest,
  EmployeeDeleteRequest,
  HomeNewsItem,
  HomeDashboardResponse,
  StampRequest,
  StampResponse,
  StampHistoryEntryResponse,
  StampHistoryResponse,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/auth/login",
    alias: "login",
    description: "メールとパスワードでログインし、セッションを開始します",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LoginRequest,
      },
    ],
    response: LoginResponse,
    errors: [
      {
        status: 401,
        description: "認証失敗",
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "post",
    path: "/api/auth/logout",
    alias: "logout",
    description: "セッションを終了します",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/auth/session",
    alias: "getSession",
    description: "現在の認証状態と従業員概要を返します",
    requestFormat: "json",
    response: SessionResponse,
  },
  {
    method: "get",
    path: "/api/employees",
    alias: "listEmployees",
    description: "管理者のみ絞り込み可能（adminOnly&#x3D;true）",
    requestFormat: "json",
    parameters: [
      {
        name: "adminOnly",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
    ],
    response: EmployeeListResponse,
  },
  {
    method: "post",
    path: "/api/employees",
    alias: "createEmployee",
    description: "新規ユーザーを作成（ADMIN権限が必要）",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: EmployeeUpsertRequest,
      },
    ],
    response: EmployeeSummaryResponse,
    errors: [
      {
        status: 400,
        description: "リクエストエラー",
        schema: ErrorResponse,
      },
      {
        status: 409,
        description: "メールアドレス重複",
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "delete",
    path: "/api/employees",
    alias: "deleteEmployees",
    description: "複数IDに対応（ADMIN権限が必要）",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: EmployeeDeleteRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "put",
    path: "/api/employees/:employeeId",
    alias: "updateEmployee",
    description: "既存ユーザーを更新（ADMIN権限が必要）",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: EmployeeUpsertRequest,
      },
      {
        name: "employeeId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: EmployeeSummaryResponse,
    errors: [
      {
        status: 404,
        description: "従業員が見つかりません",
        schema: ErrorResponse,
      },
      {
        status: 409,
        description: "メールアドレス重複",
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "get",
    path: "/api/home/overview",
    alias: "getHomeOverview",
    description: "ログイン中の従業員情報とお知らせ一覧を返却",
    requestFormat: "json",
    response: HomeDashboardResponse,
    errors: [
      {
        status: 401,
        description: "認証が必要です",
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "post",
    path: "/api/home/stamps",
    alias: "stamp",
    description: "出勤/退勤の打刻を記録",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: StampRequest,
      },
    ],
    response: z.object({ message: z.string() }).strict().passthrough(),
    errors: [
      {
        status: 401,
        description: "認証が必要です",
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "get",
    path: "/api/stamp-history",
    alias: "getStampHistory",
    description: "年・月の指定がなければ当月を返却",
    requestFormat: "json",
    parameters: [
      {
        name: "year",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "month",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: StampHistoryResponse,
    errors: [
      {
        status: 401,
        description: "認証が必要です",
        schema: ErrorResponse,
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
