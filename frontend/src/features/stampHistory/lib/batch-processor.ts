import type { ExportConfig, ExportProgress } from "../types";

export type BatchProcessorOptions<T> = {
  data: T[];
  batchSize: number;
  processBatch: (batch: T[], batchIndex: number) => Promise<string>;
  onProgress?: (progress: ExportProgress) => void;
};

// バッチ処理を実行
export const processBatches = async <T>(
  options: BatchProcessorOptions<T>
): Promise<string[]> => {
  const { data, batchSize, processBatch, onProgress } = options;

  const totalBatches = Math.ceil(data.length / batchSize);
  const results: string[] = [];

  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, data.length);
    const batch = data.slice(start, end);

    // 進捗通知
    if (onProgress) {
      onProgress({
        current: end,
        total: data.length,
        percentage: Math.round((end / data.length) * 100),
        phase: "processing",
      });
    }

    // バッチ処理実行
    const result = await processBatch(batch, i);
    results.push(result);

    // ブラウザへ処理を譲る（UIフリーズ防止）
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return results;
};

// 大量データのCSV生成（バッチ処理版）
export const generateCsvInBatches = async <T>(
  data: T[],
  config: ExportConfig,
  generateContent: (batch: T[], batchConfig: ExportConfig) => string
): Promise<string> => {
  const { batchSize, onProgress } = config;

  // 準備フェーズ
  if (onProgress) {
    onProgress({
      current: 0,
      total: data.length,
      percentage: 0,
      phase: "preparing",
    });
  }

  // バッチ処理実行
  const batches = await processBatches({
    data,
    batchSize,
    processBatch: async (batch) => generateContent(batch, config),
    onProgress,
  });

  // 生成フェーズ
  if (onProgress) {
    onProgress({
      current: data.length,
      total: data.length,
      percentage: 100,
      phase: "generating",
    });
  }

  // ヘッダーを最初のバッチに含めているので結合のみ
  return batches.join("\n");
};
