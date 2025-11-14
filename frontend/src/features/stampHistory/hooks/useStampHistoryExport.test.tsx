import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStampHistoryExport } from './useStampHistoryExport';
import * as batchProcessor from '../lib/batch-processor';
import * as csvGenerator from '../lib/csv-generator';
import * as blobDownloader from '../lib/blob-downloader';
import * as toastHook from '@/hooks/use-toast';
import type { ReactNode } from 'react';
import type { StampHistoryEntry } from '../types';

// モックの準備
vi.mock('../lib/batch-processor');
vi.mock('../lib/csv-generator');
vi.mock('../lib/blob-downloader');
vi.mock('@/hooks/use-toast');

describe('useStampHistoryExport', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();

    // デフォルトモック実装
    vi.mocked(csvGenerator.generateCsvContent).mockReturnValue('csv,content');
    vi.mocked(csvGenerator.generateCsvBlob).mockReturnValue(new Blob(['test'], { type: 'text/csv' }));
    vi.mocked(blobDownloader.generateFilename).mockReturnValue('test.csv');
    vi.mocked(blobDownloader.downloadBlob).mockImplementation(() => {});
    vi.mocked(toastHook.toast).mockImplementation(() => ({ id: 'test-id', dismiss: vi.fn(), update: vi.fn() }));
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ========================================
  // 小規模データのエクスポート
  // ========================================

  it('小規模データセット（1000件以下）をバッチ処理なしでエクスポートする', async () => {
    const { result } = renderHook(() => useStampHistoryExport(), { wrapper });

    const entries: StampHistoryEntry[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      employeeId: 1,
      year: '2024',
      month: '01',
      day: String(i + 1).padStart(2, '0'),
      dayOfWeek: '月',
      inTime: '09:00',
      outTime: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      overtimeMinutes: 0,
      isNightShift: false,
      updateDate: '2024-01-01',
    }));

    // エクスポート実行
    result.current.exportData({ entries, format: 'csv' });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });

    // バッチ処理は使われない
    expect(batchProcessor.generateCsvInBatches).not.toHaveBeenCalled();

    // generateCsvContent が呼ばれる
    expect(csvGenerator.generateCsvContent).toHaveBeenCalledWith(
      entries,
      expect.objectContaining({ format: 'csv' })
    );

    // ダウンロードが実行される
    expect(blobDownloader.downloadBlob).toHaveBeenCalled();

    // 成功トーストが表示される
    expect(toastHook.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'エクスポート完了',
      })
    );
  });

  // ========================================
  // 大規模データのバッチエクスポート
  // ========================================

  it('大規模データセット（1000件超）の場合バッチ処理を使用する', async () => {
    const { result } = renderHook(() => useStampHistoryExport(), { wrapper });

    const entries: StampHistoryEntry[] = Array.from({ length: 2500 }, (_, i) => ({
      id: i,
      employeeId: 1,
      year: '2024',
      month: '01',
      day: '01',
      dayOfWeek: '月',
      inTime: null,
      outTime: null,
      breakStartTime: null,
      breakEndTime: null,
      overtimeMinutes: null,
      isNightShift: null,
      updateDate: null,
    }));

    vi.mocked(batchProcessor.generateCsvInBatches).mockResolvedValue('batched,csv');

    result.current.exportData({ entries, format: 'csv' });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });

    // バッチ処理が使われる
    expect(batchProcessor.generateCsvInBatches).toHaveBeenCalledWith(
      entries,
      expect.objectContaining({ batchSize: 1000 }),
      expect.any(Function)
    );
  });

  // ========================================
  // 進捗状態の更新
  // ========================================

  it('進捗状態を正しく更新する', async () => {
    const { result } = renderHook(() => useStampHistoryExport(), { wrapper });

    // 初期状態
    expect(result.current.progress).toEqual({
      current: 0,
      total: 0,
      percentage: 0,
      phase: 'preparing',
    });

    const entries: StampHistoryEntry[] = Array.from({ length: 50 }, () => ({
      id: 1,
      employeeId: 1,
      year: '2024',
      month: '01',
      day: '01',
      dayOfWeek: '月',
      inTime: null,
      outTime: null,
      breakStartTime: null,
      breakEndTime: null,
      overtimeMinutes: null,
      isNightShift: null,
      updateDate: null,
    }));

    result.current.exportData({ entries, format: 'csv' });

    await waitFor(() => {
      expect(result.current.progress.phase).toBe('complete');
    });

    expect(result.current.progress.percentage).toBe(100);
  });

  // ========================================
  // エラーハンドリング
  // ========================================

  it('エクスポートエラーを適切に処理する', async () => {
    const { result } = renderHook(() => useStampHistoryExport(), { wrapper });

    const error = new Error('Export failed');
    vi.mocked(csvGenerator.generateCsvContent).mockImplementation(() => {
      throw error;
    });

    const entries: StampHistoryEntry[] = [
      {
        id: 1,
        employeeId: 1,
        year: '2024',
        month: '01',
        day: '01',
        dayOfWeek: '月',
        inTime: null,
        outTime: null,
        breakStartTime: null,
        breakEndTime: null,
        overtimeMinutes: null,
        isNightShift: null,
        updateDate: null,
      },
    ];

    result.current.exportData({ entries, format: 'csv' });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    // エラートーストが表示される
    expect(toastHook.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        title: 'エクスポートエラー',
      })
    );
  });

  // ========================================
  // カスタムコールバック
  // ========================================

  it('成功時にonSuccessコールバックを呼び出す', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () => useStampHistoryExport({ onSuccess }),
      { wrapper }
    );

    const entries: StampHistoryEntry[] = [
      {
        id: 1,
        employeeId: 1,
        year: '2024',
        month: '01',
        day: '01',
        dayOfWeek: '月',
        inTime: null,
        outTime: null,
        breakStartTime: null,
        breakEndTime: null,
        overtimeMinutes: null,
        isNightShift: null,
        updateDate: null,
      },
    ];

    result.current.exportData({ entries, format: 'csv' });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('エラー時にonErrorコールバックを呼び出す', async () => {
    const onError = vi.fn();
    const { result } = renderHook(
      () => useStampHistoryExport({ onError }),
      { wrapper }
    );

    vi.mocked(csvGenerator.generateCsvContent).mockImplementation(() => {
      throw new Error('Test error');
    });

    const entries: StampHistoryEntry[] = [
      {
        id: 1,
        employeeId: 1,
        year: '2024',
        month: '01',
        day: '01',
        dayOfWeek: '月',
        inTime: null,
        outTime: null,
        breakStartTime: null,
        breakEndTime: null,
        overtimeMinutes: null,
        isNightShift: null,
        updateDate: null,
      },
    ];

    result.current.exportData({ entries, format: 'csv' });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ========================================
  // フォーマット別のエクスポート
  // ========================================

  it.each(['csv', 'tsv', 'excel-csv'] as const)(
    '%s形式でエクスポートする',
    async (format) => {
      const { result } = renderHook(() => useStampHistoryExport(), { wrapper });

      const entries: StampHistoryEntry[] = [
        {
          id: 1,
          employeeId: 1,
          year: '2024',
          month: '01',
          day: '01',
          dayOfWeek: '月',
          inTime: null,
          outTime: null,
          breakStartTime: null,
          breakEndTime: null,
          overtimeMinutes: null,
          isNightShift: null,
          updateDate: null,
        },
      ];

      result.current.exportData({ entries, format });

      await waitFor(() => {
        expect(csvGenerator.generateCsvBlob).toHaveBeenCalledWith(
          expect.any(String),
          format
        );
      });
    }
  );

  // ========================================
  // reset機能
  // ========================================

  it('ミューテーション状態をリセットする', async () => {
    const { result } = renderHook(() => useStampHistoryExport(), { wrapper });

    const entries: StampHistoryEntry[] = [
      {
        id: 1,
        employeeId: 1,
        year: '2024',
        month: '01',
        day: '01',
        dayOfWeek: '月',
        inTime: null,
        outTime: null,
        breakStartTime: null,
        breakEndTime: null,
        overtimeMinutes: null,
        isNightShift: null,
        updateDate: null,
      },
    ];

    result.current.exportData({ entries, format: 'csv' });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });

    result.current.reset();

    expect(result.current.error).toBeNull();
  });

  // ========================================
  // エッジケース
  // ========================================

  it('空配列のエントリでもエクスポートできる', async () => {
    const { result } = renderHook(() => useStampHistoryExport(), { wrapper });

    const entries: StampHistoryEntry[] = [];

    result.current.exportData({ entries, format: 'csv' });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });

    expect(csvGenerator.generateCsvContent).toHaveBeenCalledWith(
      entries,
      expect.objectContaining({ format: 'csv' })
    );
  });

  it('exportAsyncを使用して非同期でエクスポートできる', async () => {
    const { result } = renderHook(() => useStampHistoryExport(), { wrapper });

    const entries: StampHistoryEntry[] = [
      {
        id: 1,
        employeeId: 1,
        year: '2024',
        month: '01',
        day: '01',
        dayOfWeek: '月',
        inTime: null,
        outTime: null,
        breakStartTime: null,
        breakEndTime: null,
        overtimeMinutes: null,
        isNightShift: null,
        updateDate: null,
      },
    ];

    const exportResult = result.current.exportAsync({ entries, format: 'csv' });

    await expect(exportResult).resolves.toBeDefined();
  });
});
