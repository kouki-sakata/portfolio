import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";

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
  label?: string;
  showText?: boolean;
  fullScreen?: boolean;
  center?: boolean;
}

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
        <SpriteIcon
          className={spinnerVariants({ size, variant })}
          data-testid="loading-spinner-icon"
          decorative
          name="loader-2"
        />
        {showText && (
          <span className="text-muted-foreground text-sm">{label}</span>
        )}
      </output>
    </div>
  );
}
