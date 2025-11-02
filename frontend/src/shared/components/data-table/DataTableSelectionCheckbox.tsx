import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref) {
    ref.current = value;
  }
}

type DataTableSelectionCheckboxProps = React.ComponentPropsWithoutRef<
  typeof Checkbox
> & {
  /**
   * クリック可能領域を拡大するラッパ要素に対して追加クラスを適用します。
   */
  hitAreaClassName?: string;
};

const DataTableSelectionCheckbox = React.forwardRef<
  React.ElementRef<typeof Checkbox>,
  DataTableSelectionCheckboxProps
>(function DataTableSelectionCheckbox(
  { className, hitAreaClassName, ...props },
  forwardedRef
) {
  const checkboxRef = React.useRef<React.ElementRef<typeof Checkbox>>(null);

  const setCheckboxRef = React.useCallback(
    (node: React.ElementRef<typeof Checkbox> | null) => {
      checkboxRef.current = node;
      assignRef(forwardedRef, node);
    },
    [forwardedRef]
  );

  const handleHitAreaPointerDown = (
    event: React.PointerEvent<HTMLSpanElement>
  ) => {
    if (
      checkboxRef.current &&
      event.target instanceof Node &&
      checkboxRef.current.contains(event.target)
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const handleHitAreaClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    if (
      checkboxRef.current &&
      event.target instanceof Node &&
      checkboxRef.current.contains(event.target)
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    checkboxRef.current?.click();
  };

  return (
    <span
      className={cn(
        "-m-2 inline-flex h-9 w-9 items-center justify-center rounded-md p-2",
        "hover:bg-muted/60 focus-within:ring-2 focus-within:ring-ring/60 focus-within:ring-offset-1 focus-within:ring-offset-background",
        hitAreaClassName
      )}
      onClick={handleHitAreaClick}
      onPointerDown={handleHitAreaPointerDown}
    >
      <Checkbox
        ref={setCheckboxRef}
        className={cn("size-4", className)}
        {...props}
      />
    </span>
  );
});

export { DataTableSelectionCheckbox };
