import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-6",
      lg: "size-8",
      xl: "size-12",
    },
    variant: {
      primary: "text-primary",
      secondary: "text-muted-foreground",
      destructive: "text-destructive",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "primary",
  },
});

export interface LoadingSpinnerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /** アクセシビリティ用のラベル */
  label?: string;
  /** ラベルテキストを表示するか */
  showText?: boolean;
  /** フルスクリーン表示 */
  fullScreen?: boolean;
  /** 中央寄せ */
  center?: boolean;
}

/**
 * ローディングスピナーコンポーネント
 *
 * @example
 * ```tsx
 * // 基本的な使用方法
 * <LoadingSpinner />
 *
 * // サイズとバリアントを指定
 * <LoadingSpinner size="lg" variant="secondary" />
 *
 * // テキスト付き
 * <LoadingSpinner showText label="データを読み込み中" />
 *
 * // フルスクリーン表示
 * <LoadingSpinner fullScreen />
 * ```
 */
export function LoadingSpinner({
  label = "読み込み中",
  size,
  variant,
  showText = false,
  fullScreen = false,
  center = false,
  className,
  ...props
}: LoadingSpinnerProps) {
  const containerClasses = cn(
    "inline-flex items-center gap-2",
    {
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm": fullScreen,
      "flex items-center justify-center": center || fullScreen,
    },
    className
  );

  return (
    <div
      className={containerClasses}
      data-testid="loading-spinner-container"
      {...props}
    >
      <output
        aria-busy="true"
        aria-label={label}
        aria-live="polite"
        className="inline-flex items-center gap-2"
      >
        <Loader2
          className={spinnerVariants({ size, variant })}
          data-testid="loading-spinner-icon"
        />
        {showText && (
          <span className="text-muted-foreground text-sm">{label}</span>
        )}
      </output>
    </div>
  );
}
