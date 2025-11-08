import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
  type MouseEvent,
  type PointerEvent,
  useCallback,
} from "react";

import { cn } from "@/lib/utils";
import { DataTableCheckbox } from "./DataTableCheckbox";

type DataTableSelectionCheckboxProps = ComponentPropsWithoutRef<
  typeof DataTableCheckbox
> & {
  /**
   * クリック可能領域の視覚的スタイルを上書きするクラス。
   */
  hitAreaClassName?: string;
};

/**
 * レスポンシブ対応のヒットエリアクラス
 *
 * デスクトップ: 32px × 32px (マウス精密操作に最適)
 * モバイル: 40px × 40px (指タップに最適、WCAG 2.2 AA準拠)
 *
 * タッチフィードバック:
 * - hover:bg-muted/60 (ホバー時)
 * - active:bg-muted/80 (タップ時、モバイル用)
 */
const interactiveHitAreaClass =
  "-m-2 inline-flex h-10 w-10 items-center justify-center rounded-md p-2 transition-colors hover:bg-muted/60 active:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background md:h-8 md:w-8 md:p-1.5";

const DataTableSelectionCheckbox = forwardRef<
  ElementRef<typeof DataTableCheckbox>,
  DataTableSelectionCheckboxProps
>(function DataTableSelectionCheckboxComponent(
  { className, hitAreaClassName, onClick, onPointerDown, ...props },
  ref
) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onClick?.(event);
    },
    [onClick]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onPointerDown?.(event);
    },
    [onPointerDown]
  );

  return (
    <DataTableCheckbox
      className={cn(
        interactiveHitAreaClass,
        "inline-flex items-center justify-center",
        hitAreaClassName,
        className
      )}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      ref={ref}
      {...props}
    />
  );
});

export { DataTableSelectionCheckbox };
