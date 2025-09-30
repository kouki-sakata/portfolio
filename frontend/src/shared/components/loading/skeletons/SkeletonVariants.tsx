import type { HTMLAttributes } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * カード形式のスケルトンコンポーネント
 */
export interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  /** フッターを表示するか */
  showFooter?: boolean;
}

export function SkeletonCard({
  className,
  showFooter = true,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      data-testid="skeleton-card"
      {...props}
    >
      <div className="space-y-1.5 p-6" data-testid="skeleton-card-header">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="p-6 pt-0" data-testid="skeleton-card-content">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      {showFooter && (
        <div
          className="flex items-center p-6 pt-0"
          data-testid="skeleton-card-footer"
        >
          <Skeleton className="h-9 w-24" />
        </div>
      )}
    </div>
  );
}

/**
 * テーブル形式のスケルトンコンポーネント
 */
export interface SkeletonTableProps extends HTMLAttributes<HTMLDivElement> {
  /** 行数 */
  rows?: number;
  /** 列数 */
  columns?: number;
  /** ヘッダー行を表示するか */
  showHeader?: boolean;
}

export function SkeletonTable({
  className,
  rows = 3,
  columns = 5,
  showHeader = false,
  ...props
}: SkeletonTableProps) {
  return (
    <div
      className={cn("w-full", className)}
      data-testid="skeleton-table"
      {...props}
    >
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            {showHeader && (
              <thead className="border-b" data-testid="skeleton-table-header">
                <tr>
                  {Array.from({ length: columns }).map((_, i) => (
                    <th
                      className="h-12 px-4 text-left align-middle font-medium"
                      key={`header-${
                        // biome-ignore lint/suspicious/noArrayIndexKey: 静的な配列なのでインデックスをキーとして使用
                        i
                      }`}
                    >
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="[&_tr:last-child]:border-0">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr
                  className="border-b transition-colors"
                  data-testid={`skeleton-table-row-${rowIndex}`}
                  key={`row-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: 静的な配列なのでインデックスをキーとして使用
                    rowIndex
                  }`}
                >
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td
                      className="p-4 align-middle"
                      data-testid={`skeleton-table-cell-${rowIndex}-${colIndex}`}
                      key={`cell-${
                        // biome-ignore lint/suspicious/noArrayIndexKey: 静的な配列なのでインデックスをキーとして使用
                        colIndex
                      }`}
                    >
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * フォーム形式のスケルトンコンポーネント
 */
export interface SkeletonFormProps extends HTMLAttributes<HTMLDivElement> {
  /** フィールド数 */
  fields?: number;
  /** 送信ボタンを表示するか */
  showButton?: boolean;
}

export function SkeletonForm({
  className,
  fields = 3,
  showButton = false,
  ...props
}: SkeletonFormProps) {
  return (
    <div
      className={cn("space-y-6", className)}
      data-testid="skeleton-form"
      {...props}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div
          className="space-y-2"
          data-testid={`skeleton-form-field-${i}`}
          key={`field-${
            // biome-ignore lint/suspicious/noArrayIndexKey: 静的な配列なのでインデックスをキーとして使用
            i
          }`}
        >
          <Skeleton
            className="h-4 w-24"
            data-testid={`skeleton-form-label-${i}`}
          />
          <Skeleton
            className="h-10 w-full"
            data-testid={`skeleton-form-input-${i}`}
          />
        </div>
      ))}
      {showButton && (
        <Skeleton className="h-10 w-32" data-testid="skeleton-form-button" />
      )}
    </div>
  );
}

/**
 * テキストブロックのスケルトンコンポーネント
 */
export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  /** 行数 */
  lines?: number;
  /** テキストバリアント */
  variant?: "default" | "heading" | "small";
  /** ランダムな幅を適用するか */
  randomWidth?: boolean;
}

const textVariantStyles = {
  default: "h-4",
  heading: "h-8",
  small: "h-3",
} as const;

const randomWidths = ["w-full", "w-3/4", "w-2/3", "w-1/2", "w-5/6"];

export function SkeletonText({
  className,
  lines = 3,
  variant = "default",
  randomWidth = false,
  ...props
}: SkeletonTextProps) {
  const getWidth = (index: number) => {
    if (!randomWidth) {
      return "w-full";
    }
    // 最後の行は短めにすることが多い
    if (index === lines - 1) {
      return randomWidths[3] ?? "w-1/2";
    }
    return randomWidths[index % randomWidths.length] ?? "w-full";
  };

  return (
    <div
      className={cn("space-y-2", className)}
      data-testid="skeleton-text"
      {...props}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          className={cn(textVariantStyles[variant], getWidth(i))}
          data-testid={`skeleton-text-line-${i}`}
          key={`line-${
            // biome-ignore lint/suspicious/noArrayIndexKey: 静的な配列なのでインデックスをキーとして使用
            i
          }`}
        />
      ))}
    </div>
  );
}
