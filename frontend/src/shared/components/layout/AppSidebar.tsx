import type React from "react";
import { NavLink } from "react-router-dom";

import { queryClient } from "@/app/config/queryClient";
import {
  attendanceRouteLoader,
  employeeAdminRouteLoader,
  homeRouteLoader,
  stampHistoryRouteLoader,
} from "@/app/providers/routeLoaders";
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
        id: "stamp",
        label: "出退勤",
        href: "/attendance",
        icon: "clock",
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

const navigationPrefetchers: Record<string, () => Promise<unknown>> = {
  "/": () => homeRouteLoader(queryClient),
  "/attendance": () => attendanceRouteLoader(queryClient),
  "/stamp-history": () => stampHistoryRouteLoader(queryClient),
  "/admin/employees": () => employeeAdminRouteLoader(queryClient),
};

const prefetchRoute = (href: string) => {
  const prefetcher = navigationPrefetchers[href];
  if (!prefetcher) {
    return;
  }

  prefetcher().catch(() => {
    // ignore prefetch errors (non-blocking)
  });
};

const NavigationItemComponent: React.FC<{
  item: NavigationItem;
  onClick?: () => void;
}> = ({ item, onClick }) => (
  <NavLink
    className={({ isActive }) =>
      cn(
        "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 font-medium text-sm transition-all duration-150",
        "hover:border-slate-200 hover:bg-slate-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
        isActive
          ? "border-primary/40 bg-primary/10 text-primary"
          : "text-slate-600",
        item.disabled && "pointer-events-none cursor-not-allowed opacity-50"
      )
    }
    onClick={onClick}
    onFocus={() => prefetchRoute(item.href)}
    onPointerEnter={() => prefetchRoute(item.href)}
    to={item.href}
  >
    <SpriteIcon
      className={cn(
        "h-5 w-5 flex-shrink-0 transition-colors",
        "group-hover:text-primary",
        "group-focus-visible:text-primary",
        "group-[aria-current='page']:text-primary"
      )}
      decorative
      name={item.icon}
    />
    <span className="flex-1 text-left">{item.label}</span>
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
      <h3 className="px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
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
}: AppSidebarProps) => (
  <>
    {isOpen ? (
      <div
        aria-hidden="true"
        className="fixed inset-0 z-30 bg-neutral-950/40 backdrop-blur-sm transition-opacity lg:hidden"
        data-testid="sidebar-overlay"
        onClick={() => onClose?.()}
      />
    ) : null}
    <aside
      className={cn(
        "app-sidebar fixed inset-y-0 left-0 z-40 w-64 border-r bg-white shadow-sm transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
        !isOpen && "-translate-x-full lg:translate-x-0",
        className
      )}
      data-testid="app-sidebar"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-4">
          <NavLink className="flex items-center gap-3" onClick={onClose} to="/">
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
          {navigationGroups.map((group) => (
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
