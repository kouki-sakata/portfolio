import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import type { EmployeeSummary } from '@/features/auth/types';

describe('EmployeeFormDialog', () => {
  const mockOnSubmit = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // mode=null では何もレンダリングしない
  // ========================================

  it('mode=nullの場合何もレンダリングしない', () => {
    const { container } = render(
      <EmployeeFormDialog
        mode={null}
        employee={null}
        open={false}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  // ========================================
  // 新規作成モードの表示
  // ========================================

  it('新規作成モードのダイアログを表示する', () => {
    render(
      <EmployeeFormDialog
        mode="create"
        employee={null}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('新規登録')).toBeInTheDocument();
    expect(screen.getByText('新しい従業員を登録します')).toBeInTheDocument();
  });

  // ========================================
  // 更新モードの表示
  // ========================================

  it('更新モードのダイアログを表示する', () => {
    const employee: EmployeeSummary = {
      id: 1,
      firstName: '太郎',
      lastName: '山田',
      email: 'yamada@example.com',
      admin: false,
    };

    render(
      <EmployeeFormDialog
        mode="update"
        employee={employee}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('従業員情報の編集')).toBeInTheDocument();
    expect(screen.getByText('従業員情報を更新します')).toBeInTheDocument();

    // デフォルト値が設定されている
    expect(screen.getByDisplayValue('太郎')).toBeInTheDocument();
    expect(screen.getByDisplayValue('山田')).toBeInTheDocument();
    expect(screen.getByDisplayValue('yamada@example.com')).toBeInTheDocument();
  });

  // ========================================
  // ダイアログを閉じる
  // ========================================

  it('キャンセルボタンがクリックされた場合onOpenChangeを呼ぶ', async () => {
    const user = userEvent.setup();
    render(
      <EmployeeFormDialog
        mode="create"
        employee={null}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  // ========================================
  // フォーム送信の委譲
  // ========================================

  it('フォーム送信をEmployeeFormに委譲する', async () => {
    const user = userEvent.setup();
    render(
      <EmployeeFormDialog
        mode="create"
        employee={null}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    // フォーム入力
    await user.type(screen.getByLabelText('名'), '太郎');
    await user.type(screen.getByLabelText('姓'), '山田');
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password123');

    await user.click(screen.getByRole('button', { name: '登録する' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        firstName: '太郎',
        lastName: '山田',
        email: 'test@example.com',
        password: 'password123',
        admin: false,
      });
    });
  });

  it('更新モードでフォーム送信を委譲する', async () => {
    const user = userEvent.setup();
    const employee: EmployeeSummary = {
      id: 1,
      firstName: '太郎',
      lastName: '山田',
      email: 'yamada@example.com',
      admin: true,
    };

    render(
      <EmployeeFormDialog
        mode="update"
        employee={employee}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    // 名前を変更
    const firstNameInput = screen.getByLabelText('名');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, '次郎');

    await user.click(screen.getByRole('button', { name: '更新する' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: '次郎',
          lastName: '山田',
          email: 'yamada@example.com',
          admin: true,
        })
      );
    });
  });

  // ========================================
  // 送信中の状態
  // ========================================

  it('送信中の場合フォームが無効化される', () => {
    render(
      <EmployeeFormDialog
        mode="create"
        employee={null}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        isSubmitting={true}
      />
    );

    expect(screen.getByLabelText('名')).toBeDisabled();
    expect(screen.getByLabelText('姓')).toBeDisabled();
    expect(screen.getByRole('button', { name: '処理中...' })).toBeDisabled();
  });

  // ========================================
  // ダイアログの開閉状態
  // ========================================

  it('open=falseの場合ダイアログが表示されない', () => {
    render(
      <EmployeeFormDialog
        mode="create"
        employee={null}
        open={false}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    // ダイアログのタイトルが見つからないことを確認
    expect(screen.queryByText('新規登録')).not.toBeInTheDocument();
  });

  it('open=trueの場合ダイアログが表示される', () => {
    render(
      <EmployeeFormDialog
        mode="create"
        employee={null}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('新規登録')).toBeInTheDocument();
  });

  // ========================================
  // 従業員情報の受け渡し
  // ========================================

  it('employee=nullの場合デフォルト値なしでフォームが表示される', () => {
    render(
      <EmployeeFormDialog
        mode="create"
        employee={null}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    // フィールドが空であることを確認
    expect(screen.getByLabelText('名')).toHaveValue('');
    expect(screen.getByLabelText('姓')).toHaveValue('');
    expect(screen.getByLabelText('メールアドレス')).toHaveValue('');
  });

  it('employeeが指定された場合デフォルト値がフォームに設定される', () => {
    const employee: EmployeeSummary = {
      id: 123,
      firstName: '花子',
      lastName: '佐藤',
      email: 'sato@example.com',
      admin: false,
    };

    render(
      <EmployeeFormDialog
        mode="update"
        employee={employee}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByDisplayValue('花子')).toBeInTheDocument();
    expect(screen.getByDisplayValue('佐藤')).toBeInTheDocument();
    expect(screen.getByDisplayValue('sato@example.com')).toBeInTheDocument();
  });

  // ========================================
  // ダイアログのアクセシビリティ
  // ========================================

  it('ダイアログにrole属性が設定されている', () => {
    render(
      <EmployeeFormDialog
        mode="create"
        employee={null}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // ========================================
  // 複合シナリオ
  // ========================================

  it('新規作成後にダイアログを閉じることができる', async () => {
    const user = userEvent.setup();
    render(
      <EmployeeFormDialog
        mode="create"
        employee={null}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    await user.type(screen.getByLabelText('名'), '太郎');
    await user.type(screen.getByLabelText('姓'), '田中');
    await user.type(screen.getByLabelText('メールアドレス'), 'tanaka@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password123');

    await user.click(screen.getByRole('button', { name: '登録する' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // その後キャンセルでダイアログを閉じる
    await user.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('バリデーションエラーがある場合送信できない', async () => {
    const user = userEvent.setup();
    render(
      <EmployeeFormDialog
        mode="create"
        employee={null}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    // 名前だけ入力して送信（他のフィールドが空）
    await user.type(screen.getByLabelText('名'), '太郎');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    // バリデーションエラーが表示される
    await waitFor(() => {
      expect(screen.getByText('姓は必須です')).toBeInTheDocument();
    });

    // onSubmitは呼ばれない
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
