import { z } from "zod";

import type {
  DailyAttendanceSnapshot,
  HomeDashboardResponse,
  StampRequest,
  StampResponse,
} from "@/features/home/types";
import { defaultHttpClient } from "@/shared/repositories/httpClientAdapter";
import type { IHttpClient } from "@/shared/repositories/types";

/**
 * Zodスキーマ定義
 */
const NewsItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  newsDate: z.string(),
  label: z.enum(["IMPORTANT", "SYSTEM", "GENERAL"]),
  content: z.string(),
  releaseFlag: z.boolean(),
  updateDate: z.string().optional(),
});

const EmployeeSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  admin: z.boolean(),
});

const AttendanceStatusSchema = z.enum([
  "NOT_ATTENDED",
  "WORKING",
  "ON_BREAK",
  "FINISHED",
]);

const IsoDateTimeString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid datetime",
  });

const DailyAttendanceSnapshotSchema = z.object({
  status: AttendanceStatusSchema,
  attendanceTime: IsoDateTimeString.nullable(),
  breakStartTime: IsoDateTimeString.nullable(),
  breakEndTime: IsoDateTimeString.nullable(),
  departureTime: IsoDateTimeString.nullable(),
  overtimeMinutes: z.number().int().nonnegative(),
});

const HomeDashboardResponseSchema = z.object({
  employee: EmployeeSchema,
  news: z.array(NewsItemSchema),
  attendance: DailyAttendanceSnapshotSchema.nullable().optional(),
});

const StampResponseSchema = z.object({
  message: z.string(),
  success: z.boolean().optional(),
});

/**
 * ホーム画面用リポジトリインターフェース
 * Single Responsibility: ホーム画面関連のデータアクセスのみを担当
 */
export type IHomeRepository = {
  getDashboard(): Promise<HomeDashboardResponse>;
  submitStamp(request: StampRequest): Promise<StampResponse>;
  toggleBreak(timestamp: string): Promise<void>;
};

/**
 * ホーム画面用リポジトリ実装
 */
export class HomeRepository implements IHomeRepository {
  private readonly httpClient: IHttpClient;

  constructor(httpClient: IHttpClient = defaultHttpClient) {
    this.httpClient = httpClient;
  }

  async getDashboard(): Promise<HomeDashboardResponse> {
    const response = await this.httpClient.get<unknown>("/home/overview");
    const parsed = HomeDashboardResponseSchema.parse(response);
    return {
      ...parsed,
      attendance: (parsed.attendance ?? null) as DailyAttendanceSnapshot | null,
    };
  }

  async submitStamp(request: StampRequest): Promise<StampResponse> {
    const response = await this.httpClient.post<unknown>(
      "/home/stamps",
      request
    );
    return StampResponseSchema.parse(response);
  }

  async toggleBreak(timestamp: string): Promise<void> {
    await this.httpClient.post<void>("/home/breaks/toggle", { timestamp });
  }
}

/**
 * Factory関数
 */
export const createHomeRepository = (
  httpClient?: IHttpClient
): IHomeRepository => new HomeRepository(httpClient);

/**
 * デフォルトインスタンス
 */
export const homeRepository = createHomeRepository();
