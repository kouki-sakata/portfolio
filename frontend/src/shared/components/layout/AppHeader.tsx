import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";
import { LazyImage } from "@/shared/components/ui/LazyImage";
import { cn } from "@/shared/utils/cn";

import { MobileNavigation } from "./MobileNavigation";

const BRAND_IMAGE_SRC = "/img/logo-small80_0.png";

type AppHeaderProps = {
  className?: string;
};

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
        className={cn(
          "border-slate-200/80 border-b bg-white/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/75",
          className
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <NavLink
            aria-label="TeamDevelop home"
            className="flex items-center gap-2 font-semibold text-slate-900 text-xl transition-colors hover:text-primary"
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
        "sticky top-0 z-40 border-slate-200/80 border-b bg-white/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/75",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <MobileNavigation className="text-slate-600" />
          <NavLink
            aria-label="TeamDevelop home"
            className="flex items-center gap-2 font-semibold text-slate-900 text-xl transition-colors hover:text-primary"
            to="/"
          >
            <LazyImage
              alt="TeamDevelop Bravo ロゴ"
              className="hidden h-9 w-9 rounded-full border border-slate-200/70 bg-white sm:block"
              src={BRAND_IMAGE_SRC}
            />
            <span className="hidden sm:inline">TeamDevelop Bravo</span>
            <span className="sm:hidden">TeamDev</span>
          </NavLink>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            aria-label="通知"
            className="relative rounded-full border border-slate-200/80 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:bg-primary/10 hover:text-primary"
            type="button"
          >
            <SpriteIcon className="h-5 w-5" decorative name="bell" />
            <span className="-right-1 -top-1 absolute flex h-3 w-3 items-center justify-center rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <div className="group relative">
            <button
              aria-label="ユーザーメニュー"
              className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:bg-primary/10 hover:text-primary"
              type="button"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 font-medium text-sm text-white shadow">
                {user
                  ? `${user.lastName.charAt(0)}${user.firstName.charAt(0)}`
                  : "U"}
              </div>

              <span className="hidden font-medium text-slate-700 text-sm sm:block">
                {user ? `${user.lastName} ${user.firstName}` : "ユーザー"}
              </span>

              <SpriteIcon className="h-4 w-4" decorative name="chevron-down" />
            </button>

            <div className="invisible absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur transition-all duration-200 group-hover:visible group-hover:opacity-100 group-hover:shadow-2xl">
              <div className="py-2">
                <div className="border-slate-200/60 border-b px-4 py-3">
                  <p className="font-semibold text-slate-900 text-sm">
                    {user ? `${user.lastName} ${user.firstName}` : "ユーザー"}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {user?.admin ? "管理者" : "一般ユーザー"}
                  </p>
                </div>

                <div className="py-1">
                  <NavLink
                    className="block px-4 py-2 text-slate-600 text-sm transition-colors hover:bg-slate-100/70 hover:text-slate-900"
                    to="/profile"
                  >
                    プロフィール
                  </NavLink>
                  <NavLink
                    className="block px-4 py-2 text-slate-600 text-sm transition-colors hover:bg-slate-100/70 hover:text-slate-900"
                    to="/settings"
                  >
                    設定
                  </NavLink>
                </div>

                <div className="border-slate-200/60 border-t py-1">
                  <button
                    className="block w-full px-4 py-2 text-left font-medium text-red-600 text-sm transition-colors hover:bg-red-50"
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
