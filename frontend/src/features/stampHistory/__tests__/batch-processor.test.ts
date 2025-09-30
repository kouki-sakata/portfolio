import { describe, expect, it, vi } from "vitest";
import { processBatches } from "../lib/batch-processor";

describe("batch-processor", () => {
  it("データを指定サイズのバッチに分割して処理する", async () => {
    const data = Array.from({ length: 2500 }, (_, i) => i);
    const batchSize = 1000;
    const processBatch = vi.fn(async (batch: number[]) =>
      batch.length.toString()
    );

    const results = await processBatches({
      data,
      batchSize,
      processBatch,
    });

    expect(processBatch).toHaveBeenCalledTimes(3); // 1000 + 1000 + 500
    expect(results).toHaveLength(3);
    expect(results[0]).toBe("1000");
    expect(results[1]).toBe("1000");
    expect(results[2]).toBe("500");
  });

  it("進捗コールバックが正しく呼ばれる", async () => {
    const data = Array.from({ length: 100 }, (_, i) => i);
    const batchSize = 30;
    const onProgress = vi.fn();
    const processBatch = vi.fn(async () => "");

    await processBatches({
      data,
      batchSize,
      processBatch,
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledTimes(4); // 30, 60, 90, 100
    expect(onProgress).toHaveBeenCalledWith({
      current: 30,
      total: 100,
      percentage: 30,
      phase: "processing",
    });
    expect(onProgress).toHaveBeenCalledWith({
      current: 100,
      total: 100,
      percentage: 100,
      phase: "processing",
    });
  });

  it("空配列の場合は処理を実行しない", async () => {
    const processBatch = vi.fn(async () => "");

    const results = await processBatches({
      data: [],
      batchSize: 100,
      processBatch,
    });

    expect(processBatch).not.toHaveBeenCalled();
    expect(results).toHaveLength(0);
  });

  it("バッチサイズがデータ長より大きい場合は1回で処理する", async () => {
    const data = [1, 2, 3, 4, 5];
    const batchSize = 10;
    const processBatch = vi.fn(async (batch: number[]) =>
      batch.length.toString()
    );

    const results = await processBatches({
      data,
      batchSize,
      processBatch,
    });

    expect(processBatch).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(1);
    expect(results[0]).toBe("5");
  });
});
