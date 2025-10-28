import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/30",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/30",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/30",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  contrastLevel?: "default" | "aa" | "aaa";
}

function Badge({
  className,
  variant,
  contrastLevel = "default",
  ...props
}: BadgeProps) {
  const contrastClasses =
    contrastLevel === "default"
      ? undefined
      : "ring-2 ring-offset-2 ring-offset-background ring-ring";

  return (
    <div
      className={cn(badgeVariants({ variant }), contrastClasses, className)}
      data-contrast-level={
        contrastLevel === "default" ? undefined : contrastLevel
      }
      {...props}
    />
  );
}

export { Badge, badgeVariants };
