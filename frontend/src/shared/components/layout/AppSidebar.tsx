import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';
import { NavigationGroup, NavigationItem } from '@/shared/types/navigation';
import {
  Home,
  Clock,
  History,
  Bell,
  Users,
  Settings,
  FileText
} from 'lucide-react';

interface AppSidebarProps {
  /** サイドバーが開いているかどうか */
  isOpen?: boolean;
  /** サイドバーを閉じるコールバック（モバイル用） */
  onClose?: () => void;
  /** 追加のCSSクラス */
  className?: string;
}

// ナビゲーションデータの定義
const navigationGroups: NavigationGroup[] = [
  {
    id: 'main',
    items: [
      {
        id: 'home',
        label: 'ホーム',
        href: '/',
        icon: Home,
      },
      {
        id: 'stamp',
        label: '出退勤',
        href: '/stamp',
        icon: Clock,
      },
      {
        id: 'history',
        label: '勤怠履歴',
        href: '/history',
        icon: History,
      },
    ],
  },
  {
    id: 'management',
    title: '管理',
    items: [
      {
        id: 'employees',
        label: '社員管理',
        href: '/employees',
        icon: Users,
      },
      {
        id: 'notifications',
        label: '通知',
        href: '/notifications',
        icon: Bell,
        badge: 3,
      },
      {
        id: 'reports',
        label: 'レポート',
        href: '/reports',
        icon: FileText,
      },
    ],
  },
  {
    id: 'settings',
    items: [
      {
        id: 'settings',
        label: '設定',
        href: '/settings',
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
      to={item.href}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          // ベーススタイル
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          // ホバー状態
          'hover:bg-gray-100 hover:text-gray-900',
          // アクティブ状態
          isActive
            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
            : 'text-gray-600',
          // 無効状態
          item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )
      }
    >
      <IconComponent className="h-5 w-5 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
          {item.badge > 99 ? '99+' : item.badge}
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
      <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {group.title}
      </h3>
    )}
    <nav className="space-y-1">
      {group.items.map((item) => (
        <NavigationItemComponent
          key={item.id}
          item={item}
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* サイドバー */}
      <aside
        className={cn(
          // ベーススタイル
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50',
          // モバイル用アニメーション
          'transform transition-transform duration-300 ease-in-out',
          // レスポンシブ表示制御
          'lg:translate-x-0 lg:static lg:z-auto',
          // モバイル時の表示制御
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* ヘッダー部分 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              TeamDevelop
            </h1>
            {/* モバイル用閉じるボタン */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              aria-label="サイドバーを閉じる"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ナビゲーション部分 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {navigationGroups.map((group) => (
              <NavigationGroupComponent
                key={group.id}
                group={group}
                onItemClick={onClose}
              />
            ))}
          </div>
        </div>

        {/* フッター部分（必要に応じて） */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            v1.0.0
          </div>
        </div>
      </aside>
    </>
  );
};