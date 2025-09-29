import type { FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";

type CardWrapperProps = {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  error?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement | HTMLDivElement>) => void;
  onFocus?: (event: FocusEvent<HTMLButtonElement | HTMLDivElement>) => void;
  onBlur?: (event: FocusEvent<HTMLButtonElement | HTMLDivElement>) => void;
  onKeyDown?: (
    event: KeyboardEvent<HTMLButtonElement | HTMLDivElement>
  ) => void;
};

export const CardWrapper = ({
  children,
  className,
  header,
  footer,
  loading,
  error,
  onClick,
  onFocus,
  onBlur,
  onKeyDown,
}: CardWrapperProps) => {
  if (loading) {
    return (
      <output aria-label="Loading" className={className}>
        <div>Loading...</div>
      </output>
    );
  }

  if (error) {
    return (
      <div className={className} role="alert">
        <div>{error}</div>
      </div>
    );
  }

  // Use button when onClick is provided for better accessibility
  if (onClick) {
    return (
      <button
        className={className}
        data-testid="card"
        onBlur={onBlur}
        onClick={onClick}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        type="button"
      >
        {header && <div data-testid="card-header">{header}</div>}

        <div data-testid="card-content">{children}</div>

        {footer && <div data-testid="card-footer">{footer}</div>}
      </button>
    );
  }

  // Use div when not interactive
  return (
    <div className={className} data-testid="card">
      {header && <div data-testid="card-header">{header}</div>}

      <div data-testid="card-content">{children}</div>

      {footer && <div data-testid="card-footer">{footer}</div>}
    </div>
  );
};
