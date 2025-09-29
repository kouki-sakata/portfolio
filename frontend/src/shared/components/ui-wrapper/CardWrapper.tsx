import type { FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";

type CardWrapperProps = {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  error?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onFocus?: (event: FocusEvent<HTMLDivElement>) => void;
  onBlur?: (event: FocusEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
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
      <div aria-label="Loading" className={className} role="status">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} role="alert">
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div
      className={className}
      data-testid="card"
      onBlur={onBlur}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      tabIndex={onClick ? 0 : undefined}
    >
      {header && <div data-testid="card-header">{header}</div>}

      <div data-testid="card-content">{children}</div>

      {footer && <div data-testid="card-footer">{footer}</div>}
    </div>
  );
};
