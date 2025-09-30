import type { ExportFormat, ExportResult } from "../types";

// Blobをダウンロード
export const downloadBlob = (result: ExportResult): void => {
  const { blob, filename } = result;

  // a要素を作成してクリック
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // DOMに追加してクリック（Safari対応）
  document.body.appendChild(link);
  link.click();

  // クリーンアップ
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ファイル名を生成
export const generateFilename = (
  prefix: string,
  format: ExportFormat,
  timestamp: Date = new Date()
): string => {
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, "0");
  const day = String(timestamp.getDate()).padStart(2, "0");
  const hours = String(timestamp.getHours()).padStart(2, "0");
  const minutes = String(timestamp.getMinutes()).padStart(2, "0");

  const dateStr = `${year}${month}${day}_${hours}${minutes}`;
  const extension = format === "tsv" ? "tsv" : "csv";

  return `${prefix}_${dateStr}.${extension}`;
};
