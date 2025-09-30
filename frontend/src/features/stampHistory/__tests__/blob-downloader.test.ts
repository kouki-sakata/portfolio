import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { downloadBlob, generateFilename } from "../lib/blob-downloader";
import type { ExportResult } from "../types";

// Setup URL.createObjectURL and URL.revokeObjectURL mocks for jsdom
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn();
  URL.revokeObjectURL = vi.fn();
}

describe("blob-downloader", () => {
  describe("downloadBlob", () => {
    let createElementSpy: MockInstance<[tagName: string, options?: ElementCreationOptions], HTMLElement>;
    let createObjectURLSpy: MockInstance<[blob: Blob | MediaSource], string>;
    let revokeObjectURLSpy: MockInstance<[url: string], void>;
    let mockLink: HTMLAnchorElement;

    beforeEach(() => {
      mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      createElementSpy = vi
        .spyOn(document, "createElement")
        .mockReturnValue(mockLink);
      createObjectURLSpy = vi
        .spyOn(URL, "createObjectURL")
        .mockReturnValue("blob:mock-url");
      revokeObjectURLSpy = vi
        .spyOn(URL, "revokeObjectURL")
        .mockImplementation(() => {
          // Intentionally empty - mocking URL.revokeObjectURL
        });

      vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink);
      vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("Blobをダウンロードする", () => {
      const mockBlob = new Blob(["test content"], { type: "text/csv" });
      const result: ExportResult = {
        blob: mockBlob,
        filename: "test.csv",
        rowCount: 10,
        timestamp: new Date(),
      };

      downloadBlob(result);

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.href).toBe("blob:mock-url");
      expect(mockLink.download).toBe("test.csv");
      expect(mockLink.click).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
    });

    it("DOM要素を適切にクリーンアップする", () => {
      const mockBlob = new Blob(["test content"], { type: "text/csv" });
      const result: ExportResult = {
        blob: mockBlob,
        filename: "test.csv",
        rowCount: 10,
        timestamp: new Date(),
      };

      const appendChildSpy = vi.spyOn(document.body, "appendChild");
      const removeChildSpy = vi.spyOn(document.body, "removeChild");

      downloadBlob(result);

      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    });
  });

  describe("generateFilename", () => {
    it("CSV形式のファイル名を生成する", () => {
      const timestamp = new Date("2025-01-15T09:30:00");
      const filename = generateFilename("stamp_history", "csv", timestamp);

      expect(filename).toBe("stamp_history_20250115_0930.csv");
    });

    it("TSV形式のファイル名を生成する", () => {
      const timestamp = new Date("2025-01-15T14:45:00");
      const filename = generateFilename("stamp_history", "tsv", timestamp);

      expect(filename).toBe("stamp_history_20250115_1445.tsv");
    });

    it("Excel用CSV形式のファイル名を生成する", () => {
      const timestamp = new Date("2025-01-15T23:59:00");
      const filename = generateFilename(
        "stamp_history",
        "excel-csv",
        timestamp
      );

      expect(filename).toBe("stamp_history_20250115_2359.csv");
    });

    it("現在時刻を使用してファイル名を生成する", () => {
      const filename = generateFilename("stamp_history", "csv");

      // ファイル名の形式をチェック
      expect(filename).toMatch(/^stamp_history_\d{8}_\d{4}\.csv$/);
    });

    it("月と日を0埋めする", () => {
      const timestamp = new Date("2025-01-01T01:01:00");
      const filename = generateFilename("stamp_history", "csv", timestamp);

      expect(filename).toBe("stamp_history_20250101_0101.csv");
    });
  });
});
