import type {
  CsvColumn,
  ExportConfig,
  ExportFormat,
  StampHistoryEntry,
} from "../types";

// フォーマット別の区切り文字と設定
const FORMAT_CONFIG: Record<ExportFormat, { delimiter: string; bom: boolean }> =
  {
    csv: { delimiter: ",", bom: false },
    tsv: { delimiter: "\t", bom: false },
    "excel-csv": { delimiter: ",", bom: true }, // Excel用BOM付きUTF-8
  };

// CSVフィールドのエスケープ処理
const escapeField = (
  value: string | null | undefined,
  delimiter: string
): string => {
  // null/undefined対応
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // エスケープが必要な条件: 区切り文字、改行、ダブルクォートを含む
  const needsEscape =
    stringValue.includes(delimiter) ||
    stringValue.includes("\n") ||
    stringValue.includes("\r") ||
    stringValue.includes('"');

  if (!needsEscape) {
    return stringValue;
  }

  // ダブルクォートを2つに変換してエスケープ
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
};

// カラム定義
const STAMP_HISTORY_COLUMNS: CsvColumn<StampHistoryEntry>[] = [
  { header: "年", accessor: (row) => row.year ?? "" },
  { header: "月", accessor: (row) => row.month ?? "" },
  { header: "日", accessor: (row) => row.day ?? "" },
  { header: "曜日", accessor: (row) => row.dayOfWeek ?? "" },
  { header: "出勤時刻", accessor: (row) => row.inTime ?? "" },
  { header: "退勤時刻", accessor: (row) => row.outTime ?? "" },
  { header: "休憩開始", accessor: (row) => row.breakStartTime ?? "" },
  { header: "休憩終了", accessor: (row) => row.breakEndTime ?? "" },
  {
    header: "残業分数",
    accessor: (row) => (row.overtimeMinutes ?? "").toString(),
  },
  { header: "更新日時", accessor: (row) => row.updateDate ?? "" },
];

// CSV行を生成
const generateCsvRow = (
  row: StampHistoryEntry,
  columns: CsvColumn<StampHistoryEntry>[],
  delimiter: string
): string => {
  const fields = columns.map((col) => {
    const value = col.accessor(row);
    return escapeField(value, delimiter);
  });
  return fields.join(delimiter);
};

// ヘッダー行を生成
const generateHeaderRow = (
  columns: CsvColumn<StampHistoryEntry>[],
  delimiter: string
): string => {
  const headers = columns.map((col) => escapeField(col.header, delimiter));
  return headers.join(delimiter);
};

// CSV文字列を生成（バッチ対応）
export const generateCsvContent = (
  entries: StampHistoryEntry[],
  config: ExportConfig
): string => {
  const { format, includeHeaders } = config;
  const { delimiter } = FORMAT_CONFIG[format];

  const lines: string[] = [];

  // ヘッダー行
  if (includeHeaders) {
    lines.push(generateHeaderRow(STAMP_HISTORY_COLUMNS, delimiter));
  }

  // データ行
  for (const entry of entries) {
    lines.push(generateCsvRow(entry, STAMP_HISTORY_COLUMNS, delimiter));
  }

  return lines.join("\n");
};

// BOM付きUTF-8バイト配列を生成
const addBom = (content: string): Uint8Array => {
  const Bom = "\uFEFF";
  const textEncoder = new TextEncoder();
  return textEncoder.encode(Bom + content);
};

// Blobを生成
export const generateCsvBlob = (
  content: string,
  format: ExportFormat
): Blob => {
  const config = FORMAT_CONFIG[format];

  if (config.bom) {
    const withBom = addBom(content);
    return new Blob([withBom], { type: "text/csv;charset=utf-8;" });
  }

  return new Blob([content], { type: "text/csv;charset=utf-8;" });
};
