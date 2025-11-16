import { z } from "zod";

import type { StampRequestStatus } from "@/features/stampRequestWorkflow/types";

export type MonthlyStats = {
  totalWorkingDays: number;
  totalWorkingHours: number;
  averageWorkingHours: number;
  presentDays: number;
  absentDays: number;
  totalOvertimeMinutes: number;
};

export const emptyMonthlySummary: MonthlyStats = {
  totalWorkingDays: 0,
  totalWorkingHours: 0,
  averageWorkingHours: 0,
  presentDays: 0,
  absentDays: 0,
  totalOvertimeMinutes: 0,
};

export type StampHistoryEntry = {
  id: number | null;
  employeeId: number | null;
  year: string | null;
  month: string | null;
  day: string | null;
  dayOfWeek: string | null;
  inTime: string | null;
  outTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  overtimeMinutes: number | null;
  isNightShift: boolean | null;
  updateDate: string | null;
  requestStatus?: StampRequestStatus | null;
  requestId?: number | null;
};

export type StampHistoryResponse = {
  selectedYear: string;
  selectedMonth: string;
  years: string[];
  months: string[];
  entries: StampHistoryEntry[];
  summary: MonthlyStats;
};

// 打刻更新リクエスト型
export type UpdateStampRequest = {
  id: number;
  inTime?: string;
  outTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isNightShift?: boolean;
};

// 打刻新規作成リクエスト型
export type CreateStampRequest = {
  employeeId: number;
  year: string;
  month: string;
  day: string;
  inTime?: string;
  outTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isNightShift?: boolean;
};

// 打刻削除リクエスト型
export type DeleteStampRequest = {
  id: number;
};

// 編集フォーム用Zodスキーマ
const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":");
  return Number.parseInt(hours ?? "0", 10) * 60 + Number.parseInt(minutes ?? "0", 10);
};

const hasValidTimeRange = (
  inTime: string,
  outTime: string,
  isNightShift: boolean | undefined
): boolean => {
  const inMinutes = toMinutes(inTime);
  const outMinutes = toMinutes(outTime);

  if (isNightShift) {
    const adjustedOut = outMinutes <= inMinutes ? outMinutes + 24 * 60 : outMinutes;
    return adjustedOut > inMinutes;
  }

  return outMinutes > inMinutes;
};

export const EditStampSchema = z
  .object({
    id: z.number(),
    inTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "時刻はHH:MM形式で入力してください",
      })
      .optional()
      .or(z.literal("")),
    outTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "時刻はHH:MM形式で入力してください",
      })
      .optional()
      .or(z.literal("")),
    breakStartTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "時刻はHH:MM形式で入力してください",
      })
      .optional()
      .or(z.literal("")),
    breakEndTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "時刻はHH:MM形式で入力してください",
      })
      .optional()
      .or(z.literal("")),
    isNightShift: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // すべて空の場合はエラー
      const hasAnyField =
        (data.inTime && data.inTime !== "") ||
        (data.outTime && data.outTime !== "") ||
        (data.breakStartTime && data.breakStartTime !== "") ||
        (data.breakEndTime && data.breakEndTime !== "") ||
        data.isNightShift !== undefined;

      if (!hasAnyField) {
        return false;
      }

      // 退勤時刻が出勤時刻より前の場合はエラー
      if (data.inTime && data.outTime && data.inTime !== "" && data.outTime !== "") {
        return hasValidTimeRange(data.inTime, data.outTime, data.isNightShift);
      }

      // 休憩終了が休憩開始より前の場合はエラー
      if (data.breakStartTime && data.breakEndTime && data.breakStartTime !== "" && data.breakEndTime !== "") {
        return data.breakEndTime > data.breakStartTime;
      }

      return true;
    },
    {
      message: "時刻を正しく入力してください",
      path: ["outTime"],
    }
  );

export type EditStampFormData = z.infer<typeof EditStampSchema>;

// CSV エクスポート関連の型定義

// エクスポート形式
export type ExportFormat = "csv" | "tsv" | "excel-csv";

// エクスポート設定
export type ExportConfig = {
  format: ExportFormat;
  filename: string;
  batchSize: number;
  includeHeaders: boolean;
  onProgress?: (progress: ExportProgress) => void;
};

// エクスポート進捗
export type ExportProgress = {
  current: number;
  total: number;
  percentage: number;
  phase: "preparing" | "processing" | "generating" | "complete";
};

// CSVカラム定義
export type CsvColumn<T> = {
  header: string;
  accessor: (row: T) => string;
  escape?: boolean;
};

// エクスポート結果
export type ExportResult = {
  blob: Blob;
  filename: string;
  rowCount: number;
  timestamp: Date;
};
