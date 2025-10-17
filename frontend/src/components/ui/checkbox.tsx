import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        // Base styles: 16x16px visual size with rounded corners
        "peer size-4 shrink-0 rounded-md border border-input shadow-xs outline-none",
        // Extended hit area using pseudo-element (48x48px for WCAG 2.5.8 AAA)
        "before:absolute before:inset-[-16px] before:content-['']",
        // Interactive cursor
        "relative cursor-pointer",
        // Transitions and animations
        "transition-all duration-200 ease-in-out",
        // Focus states with enhanced visibility for accessibility
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "focus-visible:scale-110",
        // Hover states for better visual feedback
        "hover:scale-105 hover:border-ring hover:shadow-sm",
        // Active/pressed state for touch feedback
        "active:scale-95",
        // Checked state with enhanced visual feedback
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "data-[state=checked]:text-primary-foreground data-[state=checked]:shadow-md",
        "data-[state=checked]:scale-105",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100",
        // Invalid/error state
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          "flex items-center justify-center text-current",
          // Smooth check mark animation
          "transition-transform duration-150 ease-in-out",
          "data-[state=checked]:scale-100",
          "data-[state=unchecked]:scale-0"
        )}
        data-slot="checkbox-indicator"
      >
        <SpriteIcon className="size-3.5" decorative name="check" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
