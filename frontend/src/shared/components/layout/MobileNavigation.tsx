import { Menu, X } from 'lucide-react';
import React, { useState } from 'react';

import { cn } from '@/shared/utils/cn';

import { AppSidebar } from './AppSidebar';

interface MobileNavigationProps {
  /** 追加のCSSクラス */
  className?: string;
}

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
        onClick={toggleSidebar}
        className={cn(
          // ベーススタイル
          'p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100',
          // フォーカス状態
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          // トランジション
          'transition-colors duration-200',
          // デスクトップでは非表示
          'lg:hidden',
          className
        )}
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* モバイルサイドバー */}
      <AppSidebar
        isOpen={isOpen}
        onClose={closeSidebar}
        className="lg:hidden"
      />
    </>
  );
};