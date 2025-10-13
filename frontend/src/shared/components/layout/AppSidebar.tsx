import type React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";
import type {
  NavigationGroup,
  NavigationItem,
} from "@/shared/types/navigation";
import { cn } from "@/shared/utils/cn";

type AppSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
};

const navigationGroups: NavigationGroup[] = [
  {
    id: "main",
    items: [
      {
        id: "home",
        label: "ホーム",
        href: "/",
        icon: "home",
      },
      {
        id: "history",
        label: "勤怠履歴",
        href: "/stamp-history",
        icon: "history",
      },
    ],
  },
  {
    id: "management",
    title: "管理",
    items: [
      {
        id: "employees",
        label: "社員管理",
        href: "/admin/employees",
        icon: "users",
      },
      {
        id: "notifications",
        label: "通知",
        href: "/notifications",
        icon: "bell",
        badge: 3,
      },
      {
        id: "reports",
        label: "レポート",
        href: "/reports",
        icon: "file-text",
      },
    ],
  },
  {
    id: "settings",
    items: [
      {
        id: "settings",
        label: "設定",
        href: "/settings",
        icon: "settings",
      },
    ],
  },
];

const NavigationItemComponent: React.FC<{
  item: NavigationItem;
  onClick?: () => void;
}> = ({ item, onClick }) => (
  <NavLink
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
        "hover:bg-gray-100/50 hover:text-gray-900",
        isActive
          ? "border-blue-700 border-r-2 bg-blue-50 text-blue-700"
          : "text-gray-600",
        item.disabled && "pointer-events-none cursor-not-allowed opacity-50"
      )
    }
    onClick={onClick}
    to={item.href}
  >
    <SpriteIcon className="h-5 w-5 flex-shrink-0" decorative name={item.icon} />
    <span className="flex-1">{item.label}</span>
    {item.badge !== undefined && item.badge > 0 && (
      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-white text-xs">
        {item.badge > 99 ? "99+" : item.badge}
      </span>
    )}
  </NavLink>
);

const NavigationGroupComponent: React.FC<{
  group: NavigationGroup;
  onItemClick?: () => void;
}> = ({ group, onItemClick }) => (
  <div className="space-y-1">
    {group.title && (
      <h3 className="px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
        {group.title}
      </h3>
    )}
    <nav className="space-y-1">
      {group.items.map((item) => (
        <NavigationItemComponent
          item={item}
          key={item.id}
          onClick={onItemClick}
        />
      ))}
    </nav>
  </div>
);

export const AppSidebar = ({
  isOpen = true,
  onClose,
  className,
}: AppSidebarProps) => {
  const { user } = useAuth();
  const isAdmin = user?.admin ?? false;

  // 管理者のみに表示するメニュー項目をフィルタリング
  const filteredNavigationGroups = navigationGroups
    .map((group) => {
      // 管理グループは管理者のみに表示
      if (group.id === "management" && !isAdmin) {
        return null;
      }
      return group;
    })
    .filter(Boolean) as NavigationGroup[];

  return (
    <>
      {/* モバイルオーバーレイ - lg未満でのみ表示 */}
      {isOpen ? (
        <button
          aria-label="サイドバーを閉じる"
          className="fixed inset-0 z-30 bg-neutral-950/40 backdrop-blur-sm transition-opacity lg:hidden"
          data-testid="sidebar-overlay"
          onClick={() => onClose?.()}
          type="button"
        />
      ) : null}
      <aside
        aria-label="メインナビゲーション"
        className={cn(
          "app-sidebar fixed inset-y-0 left-0 z-40 w-64 border-r bg-white shadow-sm transition-transform duration-200 ease-in-out",
          // lg未満: 固定位置、開閉でtranslate制御
          !isOpen && "max-lg:-translate-x-full",
          // lg以上: 常に表示、translateなし
          "lg:static lg:translate-x-0",
          className
        )}
        data-testid="app-sidebar"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-4">
            <NavLink
              className="flex items-center gap-3"
              onClick={onClose}
              to="/"
            >
              <SpriteIcon
                className="h-5 w-5 text-blue-600"
                decorative
                name="home"
              />
              <span className="flex flex-col leading-tight">
                <span className="font-bold leading-none">TeamDevelop</span>
                <span className="text-muted-foreground text-xs leading-tight">
                  Bravo
                </span>
              </span>
            </NavLink>
            <button
              aria-label="サイドバーを閉じる"
              className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:hidden"
              onClick={() => onClose?.()}
              type="button"
            >
              <SpriteIcon className="h-4 w-4" decorative name="x" />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-6">
            {filteredNavigationGroups.map((group) => (
              <NavigationGroupComponent
                group={group}
                key={group.id}
                onItemClick={onClose}
              />
            ))}
          </div>

          <footer className="mt-auto px-4 pb-4 text-muted-foreground text-xs">
            v1.0.0
          </footer>
        </div>
      </aside>
    </>
  );
};
