import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { MobileNavigation } from '../MobileNavigation';

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

const MobileNavigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('MobileNavigation', () => {
  it('初期状態でハンバーガーメニューボタンが表示される', () => {
    render(
      <MobileNavigationWrapper>
        <MobileNavigation />
      </MobileNavigationWrapper>
    );

    // メニューボタンが表示されている
    const menuButton = screen.getByLabelText('メニューを開く');
    expect(menuButton).toBeInTheDocument();
  });

  it('メニューボタンをクリックすると状態が切り替わる', () => {
    render(
      <MobileNavigationWrapper>
        <MobileNavigation />
      </MobileNavigationWrapper>
    );

    const menuButton = screen.getByLabelText('メニューを開く');

    // 初期状態: メニューを開くボタン
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    // ボタンをクリック
    fireEvent.click(menuButton);

    // 状態変更後: メニューを閉じるボタン
    const closeButton = screen.getByLabelText('メニューを閉じる');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('メニューが開いている時にサイドバーが表示される', () => {
    render(
      <MobileNavigationWrapper>
        <MobileNavigation />
      </MobileNavigationWrapper>
    );

    // メニューを開く
    const menuButton = screen.getByLabelText('メニューを開く');
    fireEvent.click(menuButton);

    // サイドバーの内容が表示される
    expect(screen.getByText('TeamDevelop')).toBeInTheDocument();
    expect(screen.getByText('ホーム')).toBeInTheDocument();
  });

  it('サイドバーのナビゲーションアイテムをクリックするとメニューが閉じる', () => {
    render(
      <MobileNavigationWrapper>
        <MobileNavigation />
      </MobileNavigationWrapper>
    );

    // メニューを開く
    const menuButton = screen.getByLabelText('メニューを開く');
    fireEvent.click(menuButton);

    // ナビゲーションアイテムをクリック
    const homeLink = screen.getByText('ホーム');
    fireEvent.click(homeLink);

    // メニューが閉じているかチェック
    const reopenButton = screen.getByLabelText('メニューを開く');
    expect(reopenButton).toBeInTheDocument();
    expect(reopenButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('オーバーレイをクリックするとメニューが閉じる', () => {
    render(
      <MobileNavigationWrapper>
        <MobileNavigation />
      </MobileNavigationWrapper>
    );

    // メニューを開く
    const menuButton = screen.getByLabelText('メニューを開く');
    fireEvent.click(menuButton);

    // オーバーレイをクリック
    const overlay = document.querySelector('.bg-black.bg-opacity-50');
    if (overlay) {
      fireEvent.click(overlay);
    }

    // メニューが閉じているかチェック
    const reopenButton = screen.getByLabelText('メニューを開く');
    expect(reopenButton).toBeInTheDocument();
  });

  it('カスタムクラス名が適用される', () => {
    const customClass = 'custom-mobile-nav-class';

    render(
      <MobileNavigationWrapper>
        <MobileNavigation className={customClass} />
      </MobileNavigationWrapper>
    );

    const menuButton = screen.getByLabelText('メニューを開く');
    expect(menuButton).toHaveClass(customClass);
  });

  it('適切なアクセシビリティ属性が設定されている', () => {
    render(
      <MobileNavigationWrapper>
        <MobileNavigation />
      </MobileNavigationWrapper>
    );

    const menuButton = screen.getByLabelText('メニューを開く');

    // 初期状態のaria-expanded
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    // メニューを開く
    fireEvent.click(menuButton);

    // 開いた状態のaria-expanded
    const closeButton = screen.getByLabelText('メニューを閉じる');
    expect(closeButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('デスクトップ画面では非表示のクラスが適用される', () => {
    render(
      <MobileNavigationWrapper>
        <MobileNavigation />
      </MobileNavigationWrapper>
    );

    const menuButton = screen.getByLabelText('メニューを開く');
    expect(menuButton).toHaveClass('lg:hidden');
  });

  it('フォーカス管理が適切に行われる', () => {
    render(
      <MobileNavigationWrapper>
        <MobileNavigation />
      </MobileNavigationWrapper>
    );

    const menuButton = screen.getByLabelText('メニューを開く');

    // フォーカススタイルのクラスが含まれている
    expect(menuButton).toHaveClass('focus:outline-none');
    expect(menuButton).toHaveClass('focus:ring-2');
    expect(menuButton).toHaveClass('focus:ring-blue-500');
  });
});