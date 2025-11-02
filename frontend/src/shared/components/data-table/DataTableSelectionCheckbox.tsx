import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
  type MouseEvent,
  type PointerEvent,
  useCallback,
} from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type DataTableSelectionCheckboxProps = ComponentPropsWithoutRef<
  typeof Checkbox
> & {
  /**
   * クリック可能領域の視覚的スタイルを上書きするクラス。
   */
  hitAreaClassName?: string;
};

const interactiveHitAreaClass =
  "-m-2 inline-flex h-9 w-9 items-center justify-center rounded-md p-2 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background";

const DataTableSelectionCheckbox = forwardRef<
  ElementRef<typeof Checkbox>,
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
    <Checkbox
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
