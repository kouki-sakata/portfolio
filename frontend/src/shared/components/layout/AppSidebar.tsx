import {
  Bell,
  Clock,
  FileText,
  History,
  Home,
  Settings,
  Users,
} from "lucide-react";
import type React from "react";
import { NavLink } from "react-router-dom";

import type {
  NavigationGroup,
  NavigationItem,
} from "@/shared/types/navigation";
import { cn } from "@/shared/utils/cn";

type AppSidebarProps = {
  /** サイドバーが開いているかどうか */
  isOpen?: boolean;
  /** サイドバーを閉じるコールバック（モバイル用） */
  onClose?: () => void;
  /** 追加のCSSクラス */
  className?: string;
};

// ナビゲーションデータの定義
const navigationGroups: NavigationGroup[] = [
  {
    id: "main",
    items: [
      {
        id: "home",
        label: "ホーム",
        href: "/",
        icon: Home,
      },
      {
        id: "stamp",
        label: "出退勤",
        href: "/stamp",
        icon: Clock,
      },
      {
        id: "history",
        label: "勤怠履歴",
        href: "/history",
        icon: History,
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
        href: "/employees",
        icon: Users,
      },
      {
        id: "notifications",
        label: "通知",
        href: "/notifications",
        icon: Bell,
        badge: 3,
      },
      {
        id: "reports",
        label: "レポート",
        href: "/reports",
        icon: FileText,
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
        icon: Settings,
      },
    ],
  },
];

/**
 * ナビゲーションアイテムコンポーネント
 */
const NavigationItemComponent: React.FC<{
  item: NavigationItem;
  onClick?: () => void;
}> = ({ item, onClick }) => {
  const IconComponent = item.icon;

  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          // ベーススタイル
          "flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
          // ホバー状態
          "hover:bg-gray-100 hover:text-gray-900",
          // アクティブ状態
          isActive
            ? "border-blue-700 border-r-2 bg-blue-50 text-blue-700"
            : "text-gray-600",
          // 無効状態
          item.disabled && "pointer-events-none cursor-not-allowed opacity-50"
        )
      }
      onClick={onClick}
      to={item.href}
    >
      <IconComponent className="h-5 w-5 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-white text-xs">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </NavLink>
  );
};

/**
 * ナビゲーショングループコンポーネント
 */
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

/**
 * アプリケーションサイドバーコンポーネント
 *
 * レスポンシブ対応：
 * - デスクトップ: 常時表示（lg:block）
 * - モバイル: ハンバーガーメニューから表示
 */
export const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen = false,
  onClose,
  className,
}) => {
  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          data-testid="sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <aside
        className={cn(
          // ベーススタイル
          "fixed top-0 left-0 z-50 h-full w-64 border-gray-200 border-r bg-white",
          // モバイル用アニメーション
          "transform transition-transform duration-300 ease-in-out",
          // レスポンシブ表示制御
          "lg:static lg:z-auto lg:translate-x-0",
          // モバイル時の表示制御
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
        data-testid="app-sidebar"
      >
        {/* ヘッダー部分 */}
        <div className="border-gray-200 border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-gray-900 text-xl">TeamDevelop</h1>
            {/* モバイル用閉じるボタン */}
            <button
              aria-label="サイドバーを閉じる"
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
              onClick={onClose}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* ナビゲーション部分 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {navigationGroups.map((group) => (
              <NavigationGroupComponent
                group={group}
                key={group.id}
                onItemClick={onClose}
              />
            ))}
          </div>
        </div>

        {/* フッター部分（必要に応じて） */}
        <div className="border-gray-200 border-t p-4">
          <div className="text-center text-gray-500 text-xs">v1.0.0</div>
        </div>
      </aside>
    </>
  );
};
