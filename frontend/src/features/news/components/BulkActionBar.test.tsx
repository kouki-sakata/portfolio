import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BulkActionBar } from './BulkActionBar';
import type { UseMutationResult } from '@tanstack/react-query';
import type { BulkMutationResult } from '../hooks/useNews';

// モックミューテーションの作成ヘルパー
const createMockMutation = (
  isPending = false
): UseMutationResult<BulkMutationResult, unknown, { ids: number[] }, unknown> => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending,
  isSuccess: false,
  isError: false,
  isIdle: true,
  data: undefined,
  error: null,
  reset: vi.fn(),
  failureCount: 0,
  failureReason: null,
  status: 'idle',
  variables: undefined,
  context: undefined,
  isPaused: false,
  submittedAt: 0,
} as UseMutationResult<BulkMutationResult, unknown, { ids: number[] }, unknown>);

describe('BulkActionBar', () => {
  const mockOnBulkDeleteClick = vi.fn();
  const mockOnPublishSuccess = vi.fn();
  const mockOnUnpublishSuccess = vi.fn();

  let publishMutation: ReturnType<typeof createMockMutation>;
  let unpublishMutation: ReturnType<typeof createMockMutation>;

  beforeEach(() => {
    vi.clearAllMocks();
    publishMutation = createMockMutation();
    unpublishMutation = createMockMutation();
  });

  // ========================================
  // selectedIds が空の場合は何も表示しない
  // ========================================

  it('アイテムが選択されていない場合は何もレンダリングしない', () => {
    const { container } = render(
      <BulkActionBar
        selectedIds={[]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  // ========================================
  // 選択件数の表示
  // ========================================

  it('選択件数を表示する', () => {
    render(
      <BulkActionBar
        selectedIds={[1, 2, 3]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    expect(screen.getByText('選択中: 3件')).toBeInTheDocument();
  });

  it('選択件数が1件の場合も正しく表示する', () => {
    render(
      <BulkActionBar
        selectedIds={[1]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    expect(screen.getByText('選択中: 1件')).toBeInTheDocument();
  });

  // ========================================
  // 一括公開ボタンのクリック
  // ========================================

  it('一括公開ボタンがクリックされた場合、公開ミューテーションを呼ぶ', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionBar
        selectedIds={[1, 2, 3]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    await user.click(screen.getByRole('button', { name: '一括公開' }));

    expect(publishMutation.mutate).toHaveBeenCalledWith(
      { ids: [1, 2, 3] },
      undefined
    );
  });

  // ========================================
  // 一括非公開ボタンのクリック
  // ========================================

  it('一括非公開ボタンがクリックされた場合、非公開ミューテーションを呼ぶ', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionBar
        selectedIds={[1, 2, 3]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    await user.click(screen.getByRole('button', { name: '一括非公開' }));

    expect(unpublishMutation.mutate).toHaveBeenCalledWith(
      { ids: [1, 2, 3] },
      undefined
    );
  });

  // ========================================
  // 削除ボタンのクリック
  // ========================================

  it('削除ボタンがクリックされた場合、onBulkDeleteClickを呼ぶ', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionBar
        selectedIds={[1, 2, 3]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    await user.click(screen.getByRole('button', { name: '選択した3件を削除' }));

    expect(mockOnBulkDeleteClick).toHaveBeenCalled();
  });

  it('削除ボタンのテキストに選択件数が含まれる', () => {
    render(
      <BulkActionBar
        selectedIds={[1, 2, 3, 4, 5]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    expect(screen.getByRole('button', { name: '選択した5件を削除' })).toBeInTheDocument();
  });

  // ========================================
  // 成功コールバック
  // ========================================

  it('公開成功時にonPublishSuccessを呼ぶ', async () => {
    const user = userEvent.setup();

    render(
      <BulkActionBar
        selectedIds={[1, 2]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
        onPublishSuccess={mockOnPublishSuccess}
      />
    );

    await user.click(screen.getByRole('button', { name: '一括公開' }));

    expect(publishMutation.mutate).toHaveBeenCalledWith(
      { ids: [1, 2] },
      { onSuccess: mockOnPublishSuccess }
    );
  });

  it('非公開成功時にonUnpublishSuccessを呼ぶ', async () => {
    const user = userEvent.setup();

    render(
      <BulkActionBar
        selectedIds={[1, 2]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
        onUnpublishSuccess={mockOnUnpublishSuccess}
      />
    );

    await user.click(screen.getByRole('button', { name: '一括非公開' }));

    expect(unpublishMutation.mutate).toHaveBeenCalledWith(
      { ids: [1, 2] },
      { onSuccess: mockOnUnpublishSuccess }
    );
  });

  // ========================================
  // ミューテーション実行中はボタンを無効化
  // ========================================

  it('公開ミューテーション実行中はすべてのボタンを無効化する', () => {
    publishMutation = createMockMutation(true); // isPending = true

    render(
      <BulkActionBar
        selectedIds={[1, 2, 3]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    expect(screen.getByRole('button', { name: '一括公開' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '一括非公開' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /選択した.*件を削除/ })).toBeDisabled();
  });

  it('非公開ミューテーション実行中はすべてのボタンを無効化する', () => {
    unpublishMutation = createMockMutation(true); // isPending = true

    render(
      <BulkActionBar
        selectedIds={[1, 2, 3]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    expect(screen.getByRole('button', { name: '一括公開' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '一括非公開' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /選択した.*件を削除/ })).toBeDisabled();
  });

  // ========================================
  // ボタンの種類とスタイル
  // ========================================

  it('各ボタンが正しく表示される', () => {
    render(
      <BulkActionBar
        selectedIds={[1, 2]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    const publishButton = screen.getByRole('button', { name: '一括公開' });
    const unpublishButton = screen.getByRole('button', { name: '一括非公開' });
    const deleteButton = screen.getByRole('button', { name: /選択した.*件を削除/ });

    expect(publishButton).toBeInTheDocument();
    expect(unpublishButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });

  // ========================================
  // レスポンシブレイアウト
  // ========================================

  it('選択中のテキストとボタンがレンダリングされる', () => {
    render(
      <BulkActionBar
        selectedIds={[1, 2, 3, 4, 5]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    // 選択中のテキスト
    expect(screen.getByText('選択中: 5件')).toBeInTheDocument();

    // すべてのボタン
    expect(screen.getByRole('button', { name: '一括公開' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '一括非公開' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '選択した5件を削除' })).toBeInTheDocument();
  });

  // ========================================
  // エッジケース
  // ========================================

  it('選択IDが多数の場合も正しく動作する', async () => {
    const user = userEvent.setup();
    const manyIds = Array.from({ length: 100 }, (_, i) => i + 1);

    render(
      <BulkActionBar
        selectedIds={manyIds}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    expect(screen.getByText('選択中: 100件')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '一括公開' }));

    expect(publishMutation.mutate).toHaveBeenCalledWith(
      { ids: manyIds },
      undefined
    );
  });

  it('コールバックが指定されていない場合もエラーなく動作する', async () => {
    const user = userEvent.setup();

    render(
      <BulkActionBar
        selectedIds={[1, 2]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    await user.click(screen.getByRole('button', { name: '一括公開' }));

    expect(publishMutation.mutate).toHaveBeenCalledWith(
      { ids: [1, 2] },
      undefined
    );
  });

  // ========================================
  // 複数回クリックの防止
  // ========================================

  it('ミューテーション実行中は再度クリックできない', async () => {
    const user = userEvent.setup();
    publishMutation = createMockMutation(true);

    render(
      <BulkActionBar
        selectedIds={[1, 2, 3]}
        onBulkDeleteClick={mockOnBulkDeleteClick}
        publishMutation={publishMutation}
        unpublishMutation={unpublishMutation}
      />
    );

    const button = screen.getByRole('button', { name: '一括公開' });
    expect(button).toBeDisabled();

    // クリックしても何も起こらない
    await user.click(button);
    expect(publishMutation.mutate).not.toHaveBeenCalled();
  });
});
