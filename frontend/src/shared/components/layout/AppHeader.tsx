import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";
import { LazyImage } from "@/shared/components/ui/LazyImage";
import { cn } from "@/shared/utils/cn";

const BRAND_IMAGE_SRC = "/img/logo-small80_0.png";

type AppHeaderProps = {
  className?: string;
  onMenuClick?: () => void;
};

export const AppHeader = ({ className, onMenuClick }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { user, authenticated, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    // ログアウト完了後、確実にログイン画面へリダイレクト
    // replace: trueで履歴を置き換え、戻るボタンでホーム画面に戻れないようにする
    navigate("/signin", { replace: true });
  };

  if (!authenticated) {
    return (
      <header
        className={cn("border-gray-200 border-b bg-white px-4 py-3", className)}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <NavLink
            aria-label="TeamDevelop home"
            className="flex items-center gap-2 font-bold text-gray-900 text-xl transition-colors hover:text-blue-600"
            to="/signin"
          >
            <LazyImage
              alt="TeamDevelop Bravo ロゴ"
              className="h-8 w-8 rounded-full"
              src={BRAND_IMAGE_SRC}
            />
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
        <div className="flex items-center gap-3">
          {/* モバイルメニューボタン */}
          <button
            aria-label="メニューを開く"
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
            onClick={onMenuClick}
            type="button"
          >
            <SpriteIcon className="h-6 w-6" decorative name="menu" />
          </button>

          <NavLink
            aria-label="TeamDevelop home"
            className="flex items-center gap-2 font-bold text-gray-900 text-xl transition-colors hover:text-blue-600 lg:ml-0"
            to="/"
          >
            <LazyImage
              alt="TeamDevelop Bravo ロゴ"
              className="hidden h-9 w-9 rounded-full sm:block"
              src={BRAND_IMAGE_SRC}
            />
            <span className="hidden sm:inline">TeamDevelop Bravo</span>
            <span className="sm:hidden">TeamDev</span>
          </NavLink>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            aria-label="通知"
            className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            type="button"
          >
            <SpriteIcon className="h-5 w-5" decorative name="bell" />
            <span className="-top-1 -right-1 absolute h-3 w-3 rounded-full bg-red-500" />
          </button>

          <div className="group relative">
            <button
              aria-label="ユーザーメニュー"
              className="flex items-center gap-2 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              type="button"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-medium text-sm text-white">
                {user
                  ? `${user.lastName.charAt(0)}${user.firstName.charAt(0)}`
                  : "U"}
              </div>

              <span className="hidden font-medium text-sm sm:block">
                {user ? `${user.lastName} ${user.firstName}` : "ユーザー"}
              </span>

              <SpriteIcon className="h-4 w-4" decorative name="chevron-down" />
            </button>

            <div className="invisible absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="py-2">
                <div className="border-gray-100 border-b px-4 py-2">
                  <p className="font-medium text-gray-900 text-sm">
                    {user ? `${user.lastName} ${user.firstName}` : "ユーザー"}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {user?.admin ? "管理者" : "一般ユーザー"}
                  </p>
                </div>

                <div className="py-1">
                  <NavLink
                    className="block px-4 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-50"
                    to="/profile"
                  >
                    プロフィール
                  </NavLink>
                </div>

                <div className="border-gray-100 border-t py-1">
                  <button
                    className="block w-full px-4 py-2 text-left text-red-600 text-sm transition-colors hover:bg-gray-50"
                    onClick={() => {
                      handleSignOut().catch(() => {
                        // logout内で処理済み
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
