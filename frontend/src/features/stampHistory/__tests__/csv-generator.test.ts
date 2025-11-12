import { describe, expect, it } from "vitest";
import { generateCsvBlob, generateCsvContent } from "../lib/csv-generator";
import type { ExportConfig, StampHistoryEntry } from "../types";

describe("csv-generator", () => {
  const mockEntries: StampHistoryEntry[] = [
    {
      id: 1,
      employeeId: 1,
      year: "2025",
      month: "01",
      day: "15",
      dayOfWeek: "水",
      inTime: "09:00",
      outTime: "18:00",
      breakStartTime: "12:00",
      breakEndTime: "12:45",
      overtimeMinutes: 60,
      isNightShift: null,
      updateDate: "2025-01-15 18:05",
    },
    {
      id: 2,
      employeeId: 1,
      year: "2025",
      month: "01",
      day: "16",
      dayOfWeek: "木",
      inTime: "09:15",
      outTime: "17:45",
      breakStartTime: null,
      breakEndTime: null,
      overtimeMinutes: 0,
      isNightShift: null,
      updateDate: "2025-01-16 17:50",
    },
  ];

  describe("generateCsvContent", () => {
    it("ヘッダー付きCSVを生成する", () => {
      const config: ExportConfig = {
        format: "csv",
        filename: "test.csv",
        batchSize: 1000,
        includeHeaders: true,
      };

      const content = generateCsvContent(mockEntries, config);
      const lines = content.split("\n");

      expect(lines[0]).toBe(
        "年,月,日,曜日,出勤時刻,退勤時刻,休憩開始,休憩終了,残業分数,更新日時"
      );
      expect(lines[1]).toBe(
        "2025,01,15,水,09:00,18:00,12:00,12:45,60,2025-01-15 18:05"
      );
      expect(lines[2]).toBe("2025,01,16,木,09:15,17:45,,,0,2025-01-16 17:50");
    });

    it("ヘッダーなしCSVを生成する", () => {
      const config: ExportConfig = {
        format: "csv",
        filename: "test.csv",
        batchSize: 1000,
        includeHeaders: false,
      };

      const content = generateCsvContent(mockEntries, config);
      const lines = content.split("\n");

      expect(lines[0]).toBe(
        "2025,01,15,水,09:00,18:00,12:00,12:45,60,2025-01-15 18:05"
      );
      expect(lines.length).toBe(2);
    });

    it("TSV形式を生成する", () => {
      const config: ExportConfig = {
        format: "tsv",
        filename: "test.tsv",
        batchSize: 1000,
        includeHeaders: true,
      };

      const content = generateCsvContent(mockEntries, config);
      const lines = content.split("\n");

      expect(lines[1]).toContain("\t");
      expect(lines[1]).not.toContain(",");
    });

    it("カンマを含むフィールドをエスケープする", () => {
      const entriesWithComma: StampHistoryEntry[] = [
        {
          ...mockEntries[0],
          dayOfWeek: "水,曜日",
        } as StampHistoryEntry,
      ];

      const config: ExportConfig = {
        format: "csv",
        filename: "test.csv",
        batchSize: 1000,
        includeHeaders: false,
      };

      const content = generateCsvContent(entriesWithComma, config);
      expect(content).toContain('"水,曜日"');
    });

    it("ダブルクォートを含むフィールドをエスケープする", () => {
      const entriesWithQuotes: StampHistoryEntry[] = [
        {
          ...mockEntries[0],
          dayOfWeek: '水"曜日',
        } as StampHistoryEntry,
      ];

      const config: ExportConfig = {
        format: "csv",
        filename: "test.csv",
        batchSize: 1000,
        includeHeaders: false,
      };

      const content = generateCsvContent(entriesWithQuotes, config);
      expect(content).toContain('"水""曜日"');
    });

    it("null/undefinedを空文字列として扱う", () => {
      const entriesWithNull: StampHistoryEntry[] = [
        {
          id: null,
          employeeId: 1,
          year: "2025",
          month: "01",
          day: "15",
          dayOfWeek: null,
          inTime: null,
          outTime: null,
          breakStartTime: null,
          breakEndTime: null,
          overtimeMinutes: null,
          isNightShift: null,
          updateDate: null,
        },
      ];

      const config: ExportConfig = {
        format: "csv",
        filename: "test.csv",
        batchSize: 1000,
        includeHeaders: false,
      };

      const content = generateCsvContent(entriesWithNull, config);
      expect(content).toBe("2025,01,15,,,,,,,");
    });
  });

  describe("generateCsvBlob", () => {
    it("CSV形式のBlobを生成する", () => {
      const content = "test,content\n1,2";
      const blob = generateCsvBlob(content, "csv");

      expect(blob.type).toBe("text/csv;charset=utf-8;");
      expect(blob.size).toBeGreaterThan(0);
    });

    it("Excel用CSV（BOM付き）のBlobを生成する", () => {
      const content = "test,content\n1,2";
      const blob = generateCsvBlob(content, "excel-csv");

      expect(blob.type).toBe("text/csv;charset=utf-8;");
      // BOM付きのBlobはサイズが元のコンテンツより大きくなる
      expect(blob.size).toBeGreaterThan(content.length);
    });
  });
});
