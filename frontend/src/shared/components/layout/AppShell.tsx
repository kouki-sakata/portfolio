import type { PropsWithChildren } from "react";

import { cn } from "@/shared/utils/cn";

interface AppShellProps extends PropsWithChildren {
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * アプリケーション全体のシェルコンポーネント
 *
 * TailwindCSSグリッドシステムを使用したレスポンシブレイアウト：
 * - モバイル: シングルカラム
 * - デスクトップ: サイドバー + メインコンテンツの2カラム
 */
export const AppShell = ({ children, className }: AppShellProps) => (
  <div
    className={cn(
      // ベースレイアウト
      "min-h-screen bg-gray-50",
      // グリッドシステム
      "grid grid-cols-1",
      // レスポンシブレイアウト（デスクトップ: サイドバー幅250px + 残りの空間）
      "lg:grid-cols-[250px_1fr]",
      className
    )}
  >
    {children}
  </div>
);
