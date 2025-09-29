import type { VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";
import {
  type buttonVariants,
  Button as ShadcnButton,
} from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFeatureFlag } from "../../hooks/use-feature-flag";

export interface ButtonWrapperProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  asChild?: boolean;
  loading?: boolean;
}

// Custom Button implementation (fallback when feature flag is disabled)
const CustomButton = forwardRef<HTMLButtonElement, ButtonWrapperProps>(
  ({ children, className, loading, disabled, ...props }, ref) => (
    <button
      className={cn(
        "rounded px-4 py-2",
        "bg-gray-200 hover:bg-gray-300",
        "focus:outline-none focus:ring-2 focus:ring-gray-400",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      disabled={disabled ?? loading}
      ref={ref}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  )
);
CustomButton.displayName = "CustomButton";

// Main wrapper component
export const ButtonWrapper = forwardRef<HTMLButtonElement, ButtonWrapperProps>(
  (
    {
      children,
      variant,
      size,
      asChild,
      loading,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const { isEnabled } = useFeatureFlag();
    const useShadcn = isEnabled("useShadcnUI");

    if (useShadcn) {
      // Use shadcn/ui Button
      return (
        <ShadcnButton
          ref={ref}
          size={size}
          variant={variant}
          {...(asChild !== undefined && { asChild })}
          className={className}
          disabled={disabled ?? loading}
          {...props}
        >
          {loading ? "Loading..." : children}
        </ShadcnButton>
      );
    }

    // Use custom implementation
    return (
      <CustomButton
        className={className}
        ref={ref}
        {...(loading !== undefined && { loading })}
        disabled={disabled}
        {...props}
      >
        {children}
      </CustomButton>
    );
  }
);

ButtonWrapper.displayName = "ButtonWrapper";
