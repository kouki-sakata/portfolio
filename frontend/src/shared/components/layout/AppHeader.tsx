import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown } from 'lucide-react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { MobileNavigation } from './MobileNavigation';
import { cn } from '@/shared/utils/cn';

interface AppHeaderProps {
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * アプリケーションヘッダーコンポーネント
 *
 * レスポンシブ対応：
 * - モバイル: ハンバーガーメニュー + ブランド名 + ユーザーメニュー
 * - デスクトップ: ブランド名 + ユーザーメニュー（ナビゲーションはサイドバーに移動）
 */
export const AppHeader = ({ className }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { user, authenticated, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    void navigate('/signin');
  };

  if (!authenticated) {
    return (
      <header
        className={cn(
          'bg-white border-b border-gray-200 px-4 py-3',
          className
        )}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <NavLink
            to="/signin"
            className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            aria-label="TeamDevelop home"
          >
            TeamDevelop Bravo
          </NavLink>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        'bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30',
        className
      )}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* 左側: モバイルメニュー + ブランド */}
        <div className="flex items-center gap-3">
          {/* モバイルナビゲーション */}
          <MobileNavigation />

          {/* ブランド名 */}
          <NavLink
            to="/"
            className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors lg:ml-0"
            aria-label="TeamDevelop home"
          >
            <span className="hidden sm:inline">TeamDevelop Bravo</span>
            <span className="sm:hidden">TeamDev</span>
          </NavLink>
        </div>

        {/* 右側: 通知 + ユーザーメニュー */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* 通知ボタン */}
          <button
            type="button"
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="通知"
          >
            <Bell className="h-5 w-5" />
            {/* 通知バッジ（必要に応じて） */}
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>

          {/* ユーザーメニュー */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="ユーザーメニュー"
            >
              {/* ユーザーアバター */}
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user ? `${user.lastName.charAt(0)}${user.firstName.charAt(0)}` : 'U'}
              </div>

              {/* ユーザー名（デスクトップのみ表示） */}
              <span className="hidden sm:block text-sm font-medium">
                {user ? `${user.lastName} ${user.firstName}` : 'ユーザー'}
              </span>

              <ChevronDown className="h-4 w-4" />
            </button>

            {/* ドロップダウンメニュー */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                {/* ユーザー情報 */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user ? `${user.lastName} ${user.firstName}` : 'ユーザー'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.admin ? '管理者' : '一般ユーザー'}
                  </p>
                </div>

                {/* メニューアイテム */}
                <div className="py-1">
                  <NavLink
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    プロフィール
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    設定
                  </NavLink>
                </div>

                {/* サインアウト */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      void handleSignOut();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                  >
                    サインアウト
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
