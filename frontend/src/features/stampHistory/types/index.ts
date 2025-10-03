import { z } from "zod";

export type MonthlyStats = {
  totalWorkingDays: number;
  totalWorkingHours: number;
  averageWorkingHours: number;
  presentDays: number;
  absentDays: number;
};

export const emptyMonthlySummary: MonthlyStats = {
  totalWorkingDays: 0,
  totalWorkingHours: 0,
  averageWorkingHours: 0,
  presentDays: 0,
  absentDays: 0,
};

export type StampHistoryEntry = {
  id: number | null;
  year: string | null;
  month: string | null;
  day: string | null;
  dayOfWeek: string | null;
  inTime: string | null;
  outTime: string | null;
  updateDate: string | null;
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
};

// 打刻削除リクエスト型
export type DeleteStampRequest = {
  id: number;
};

// 編集フォーム用Zodスキーマ
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
  })
  .refine(
    (data) => {
      // 両方空の場合はエラー
      if ((!data.inTime || data.inTime === "") && (!data.outTime || data.outTime === "")) {
        return false;
      }
      // 退勤時刻が出勤時刻より前の場合はエラー
      if (data.inTime && data.outTime && data.inTime !== "" && data.outTime !== "") {
        return data.outTime > data.inTime;
      }
      return true;
    },
    {
      message: "出勤時刻と退勤時刻を正しく入力してください",
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
