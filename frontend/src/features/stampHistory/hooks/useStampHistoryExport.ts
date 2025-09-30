import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { generateCsvInBatches } from "../lib/batch-processor";
import { downloadBlob, generateFilename } from "../lib/blob-downloader";
import { generateCsvBlob, generateCsvContent } from "../lib/csv-generator";
import type {
  ExportConfig,
  ExportFormat,
  ExportProgress,
  ExportResult,
  StampHistoryEntry,
} from "../types";

const DEFAULT_BATCH_SIZE = 1000;

type UseStampHistoryExportOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export const useStampHistoryExport = (
  options: UseStampHistoryExportOptions = {}
) => {
  const [progress, setProgress] = useState<ExportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    phase: "preparing",
  });

  const mutation = useMutation({
    mutationFn: async ({
      entries,
      format,
    }: {
      entries: StampHistoryEntry[];
      format: ExportFormat;
    }) => {
      const config: ExportConfig = {
        format,
        filename: generateFilename("stamp_history", format),
        batchSize: DEFAULT_BATCH_SIZE,
        includeHeaders: true,
        onProgress: setProgress,
      };

      // 大量データの場合はバッチ処理
      const content =
        entries.length > DEFAULT_BATCH_SIZE
          ? await generateCsvInBatches(
              entries,
              config,
              (batch, batchConfig) => {
                // 最初のバッチのみヘッダーを含める
                const modifiedConfig = {
                  ...batchConfig,
                  includeHeaders:
                    batch === entries.slice(0, DEFAULT_BATCH_SIZE),
                };
                return generateCsvContent(batch, modifiedConfig);
              }
            )
          : generateCsvContent(entries, config);

      // Blob生成
      const blob = generateCsvBlob(content, format);

      const result: ExportResult = {
        blob,
        filename: config.filename,
        rowCount: entries.length,
        timestamp: new Date(),
      };

      return result;
    },
    onSuccess: (result) => {
      // ダウンロード実行
      downloadBlob(result);

      // 完了通知
      setProgress({
        current: result.rowCount,
        total: result.rowCount,
        percentage: 100,
        phase: "complete",
      });

      toast({
        title: "エクスポート完了",
        description: `${result.rowCount}件のデータをエクスポートしました`,
      });

      options.onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "エクスポートエラー",
        description: error.message,
      });

      options.onError?.(error);
    },
  });

  return {
    exportData: mutation.mutate,
    exportAsync: mutation.mutateAsync,
    isExporting: mutation.isPending,
    progress,
    error: mutation.error,
    reset: mutation.reset,
  };
};
