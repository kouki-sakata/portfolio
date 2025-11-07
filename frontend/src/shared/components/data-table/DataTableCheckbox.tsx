import {
  Indicator as CheckboxIndicator,
  Root as CheckboxRoot,
} from "@radix-ui/react-checkbox";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";

import { cn } from "@/lib/utils";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";

/**
 * データテーブル専用のコンパクトチェックボックスコンポーネント
 *
 * 標準のCheckboxコンポーネント(16px)に対して、以下の最適化を実施:
 * - チェックボックス本体: 14px (視覚階層を改善)
 * - チェックアイコン: 12px (バランス調整)
 *
 * デザイン決定の根拠:
 * - Material Design, Ant Designのコンパクトテーブル標準に準拠
 * - 日付テキスト(16px) > チェックボックス(14px)の視覚階層を確立
 * - 情報密度を約10%向上
 */
const DataTableCheckbox = forwardRef<
  ElementRef<typeof CheckboxRoot>,
  ComponentPropsWithoutRef<typeof CheckboxRoot>
>(function DataTableCheckboxComponent({ className, ...props }, ref) {
  return (
    <CheckboxRoot
      className={cn(
        // サイズを size-4 (16px) から size-3.5 (14px) に変更
        "peer size-3.5 shrink-0 rounded-[4px] border border-input shadow-xs outline-none transition-shadow",
        // フォーカスリング
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        // 無効状態
        "disabled:cursor-not-allowed disabled:opacity-50",
        // エラー状態
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        // チェック状態
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )}
      data-slot="checkbox"
      ref={ref}
      {...props}
    >
      <CheckboxIndicator
        className="flex items-center justify-center text-current transition-none"
        data-slot="checkbox-indicator"
      >
        {/* アイコンサイズを size-3.5 (14px) から size-3 (12px) に変更 */}
        <SpriteIcon className="size-3" decorative name="check" />
      </CheckboxIndicator>
    </CheckboxRoot>
  );
});

export { DataTableCheckbox };
