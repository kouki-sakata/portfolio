import type { LucideIcon } from "lucide-react";

/**
 * ナビゲーションアイテムの基本型定義
 */
export type NavigationItem = {
  /** ナビゲーションアイテムの一意識別子 */
  id: string;
  /** 表示ラベル */
  label: string;
  /** ルートパス */
  href: string;
  /** アイコンコンポーネント */
  icon: LucideIcon;
  /** バッジ表示（通知数など） */
  badge?: number;
  /** アクティブかどうか */
  active?: boolean;
  /** 無効化されているかどうか */
  disabled?: boolean;
};

/**
 * ナビゲーショングループの型定義
 */
export type NavigationGroup = {
  /** グループの一意識別子 */
  id: string;
  /** グループ名（表示されない場合もある） */
  title?: string;
  /** グループ内のアイテム */
  items: NavigationItem[];
};

/**
 * サイドバーの状態管理用型定義
 */
export type SidebarState = {
  /** サイドバーが開いているかどうか */
  isOpen: boolean;
  /** サイドバーが折りたたまれているかどうか */
  isCollapsed: boolean;
};

/**
 * モバイルナビゲーションの状態管理用型定義
 */
export type MobileNavigationState = {
  /** モバイルメニューが開いているかどうか */
  isOpen: boolean;
};
