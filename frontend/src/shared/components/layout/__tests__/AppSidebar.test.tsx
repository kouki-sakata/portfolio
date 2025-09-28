import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AppSidebar } from '../AppSidebar';

// react-router-domのNavLinkをモック
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    NavLink: ({ to, children, className, onClick }: any) => (
      <a
        href={to}
        className={typeof className === 'function' ? className({ isActive: false }) : className}
        onClick={onClick}
      >
        {children}
      </a>
    ),
  };
});

const AppSidebarWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('AppSidebar', () => {
  it('デフォルト状態でサイドバーが正しくレンダリングされる', () => {
    render(
      <AppSidebarWrapper>
        <AppSidebar />
      </AppSidebarWrapper>
    );

    // ブランド名が表示されている
    expect(screen.getByText('TeamDevelop')).toBeInTheDocument();

    // 主要なナビゲーションアイテムが表示されている
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('出退勤')).toBeInTheDocument();
    expect(screen.getByText('勤怠履歴')).toBeInTheDocument();
    expect(screen.getByText('社員管理')).toBeInTheDocument();
    expect(screen.getByText('通知')).toBeInTheDocument();
    expect(screen.getByText('レポート')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
  });

  it('管理グループのタイトルが表示される', () => {
    render(
      <AppSidebarWrapper>
        <AppSidebar />
      </AppSidebarWrapper>
    );

    expect(screen.getByText('管理')).toBeInTheDocument();
  });

  it('通知アイテムにバッジが表示される', () => {
    render(
      <AppSidebarWrapper>
        <AppSidebar />
      </AppSidebarWrapper>
    );

    // 通知バッジ（数字の3）が表示されている
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('バージョン情報が表示される', () => {
    render(
      <AppSidebarWrapper>
        <AppSidebar />
      </AppSidebarWrapper>
    );

    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('isOpenがtrueの時、モバイル用オーバーレイが表示される', () => {
    render(
      <AppSidebarWrapper>
        <AppSidebar isOpen={true} />
      </AppSidebarWrapper>
    );

    // オーバーレイ要素が存在する（bg-black bg-opacity-50のクラスを持つ要素）
    const overlay = document.querySelector('.bg-black.bg-opacity-50');
    expect(overlay).toBeInTheDocument();
  });

  it('onCloseコールバックが呼ばれる - オーバーレイクリック', () => {
    const onCloseMock = vi.fn();

    render(
      <AppSidebarWrapper>
        <AppSidebar isOpen={true} onClose={onCloseMock} />
      </AppSidebarWrapper>
    );

    // オーバーレイをクリック
    const overlay = document.querySelector('.bg-black.bg-opacity-50');
    if (overlay) {
      fireEvent.click(overlay);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    }
  });

  it('onCloseコールバックが呼ばれる - 閉じるボタンクリック', () => {
    const onCloseMock = vi.fn();

    render(
      <AppSidebarWrapper>
        <AppSidebar isOpen={true} onClose={onCloseMock} />
      </AppSidebarWrapper>
    );

    // 閉じるボタンをクリック
    const closeButton = screen.getByLabelText('サイドバーを閉じる');
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('onCloseコールバックが呼ばれる - ナビゲーションアイテムクリック', () => {
    const onCloseMock = vi.fn();

    render(
      <AppSidebarWrapper>
        <AppSidebar onClose={onCloseMock} />
      </AppSidebarWrapper>
    );

    // ナビゲーションアイテムをクリック
    const homeLink = screen.getByText('ホーム');
    fireEvent.click(homeLink);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('カスタムクラス名が適用される', () => {
    const customClass = 'custom-sidebar-class';

    render(
      <AppSidebarWrapper>
        <AppSidebar className={customClass} />
      </AppSidebarWrapper>
    );

    // asideエレメントにカスタムクラスが適用されている
    const sidebar = document.querySelector('aside');
    expect(sidebar).toHaveClass(customClass);
  });

  it('適切なアクセシビリティ属性が設定されている', () => {
    render(
      <AppSidebarWrapper>
        <AppSidebar isOpen={true} />
      </AppSidebarWrapper>
    );

    // 閉じるボタンのaria-label
    const closeButton = screen.getByLabelText('サイドバーを閉じる');
    expect(closeButton).toBeInTheDocument();

    // オーバーレイのaria-hidden
    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeInTheDocument();
  });
});