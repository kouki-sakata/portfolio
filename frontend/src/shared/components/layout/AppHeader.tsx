import { Bell, ChevronDown } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/shared/utils/cn";

import { MobileNavigation } from "./MobileNavigation";

type AppHeaderProps = {
  /** 追加のCSSクラス */
  className?: string;
};

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
    navigate("/signin");
  };

  if (!authenticated) {
    return (
      <header
        className={cn("border-gray-200 border-b bg-white px-4 py-3", className)}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <NavLink
            aria-label="TeamDevelop home"
            className="font-bold text-gray-900 text-xl transition-colors hover:text-blue-600"
            to="/signin"
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
        "sticky top-0 z-30 border-gray-200 border-b bg-white px-4 py-3",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* 左側: モバイルメニュー + ブランド */}
        <div className="flex items-center gap-3">
          {/* モバイルナビゲーション */}
          <MobileNavigation />

          {/* ブランド名 */}
          <NavLink
            aria-label="TeamDevelop home"
            className="font-bold text-gray-900 text-xl transition-colors hover:text-blue-600 lg:ml-0"
            to="/"
          >
            <span className="hidden sm:inline">TeamDevelop Bravo</span>
            <span className="sm:hidden">TeamDev</span>
          </NavLink>
        </div>

        {/* 右側: 通知 + ユーザーメニュー */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* 通知ボタン */}
          <button
            aria-label="通知"
            className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            type="button"
          >
            <Bell className="h-5 w-5" />
            {/* 通知バッジ（必要に応じて） */}
            <span className="-top-1 -right-1 absolute h-3 w-3 rounded-full bg-red-500" />
          </button>

          {/* ユーザーメニュー */}
          <div className="group relative">
            <button
              aria-label="ユーザーメニュー"
              className="flex items-center gap-2 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              type="button"
            >
              {/* ユーザーアバター */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-medium text-sm text-white">
                {user
                  ? `${user.lastName.charAt(0)}${user.firstName.charAt(0)}`
                  : "U"}
              </div>

              {/* ユーザー名（デスクトップのみ表示） */}
              <span className="hidden font-medium text-sm sm:block">
                {user ? `${user.lastName} ${user.firstName}` : "ユーザー"}
              </span>

              <ChevronDown className="h-4 w-4" />
            </button>

            {/* ドロップダウンメニュー */}
            <div className="invisible absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="py-2">
                {/* ユーザー情報 */}
                <div className="border-gray-100 border-b px-4 py-2">
                  <p className="font-medium text-gray-900 text-sm">
                    {user ? `${user.lastName} ${user.firstName}` : "ユーザー"}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {user?.admin ? "管理者" : "一般ユーザー"}
                  </p>
                </div>

                {/* メニューアイテム */}
                <div className="py-1">
                  <NavLink
                    className="block px-4 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-50"
                    to="/profile"
                  >
                    プロフィール
                  </NavLink>
                  <NavLink
                    className="block px-4 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-50"
                    to="/settings"
                  >
                    設定
                  </NavLink>
                </div>

                {/* サインアウト */}
                <div className="border-gray-100 border-t py-1">
                  <button
                    className="block w-full px-4 py-2 text-left text-red-600 text-sm transition-colors hover:bg-gray-50"
                    onClick={() => {
                      handleSignOut().catch(() => {
                        // エラーハンドリングはlogout内で処理済み
                      });
                    }}
                    type="button"
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
