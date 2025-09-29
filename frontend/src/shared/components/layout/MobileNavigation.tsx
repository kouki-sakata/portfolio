import { Menu, X } from "lucide-react";
import type React from "react";
import { useState } from "react";

import { cn } from "@/shared/utils/cn";

import { AppSidebar } from "./AppSidebar";

type MobileNavigationProps = {
  /** 追加のCSSクラス */
  className?: string;
};

/**
 * モバイルナビゲーションコンポーネント
 *
 * ハンバーガーメニューとサイドバーを統合したコンポーネント
 * モバイル画面でのナビゲーション体験を提供
 */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
        className={cn(
          // ベーススタイル
          "rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          // フォーカス状態
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          // トランジション
          "transition-colors duration-200",
          // デスクトップでは非表示
          "lg:hidden",
          className
        )}
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* モバイルサイドバー */}
      <AppSidebar
        className="lg:hidden"
        isOpen={isOpen}
        onClose={closeSidebar}
      />
    </>
  );
};
