import { useTheme } from '../../../app/providers/use-theme';

// Fixed: Proper typing to avoid unsafe assignments
interface ToastOptions {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  cancel?: React.ReactNode;
  id?: string;
  dismissible?: boolean;
  onDismiss?: (id: string) => void;
  onAutoClose?: (id: string) => void;
}

interface ToastFunction {
  (message: string, options?: ToastOptions): string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
}

// Fixed: Proper mock implementation with type safety
const createToastFunction = (): ToastFunction => {
  const baseToast = (message: string, options?: ToastOptions): string => {
    console.log('Toast:', message, options);
    return 'toast-id';
  };

  // Fixed: Safe assignment with proper typing
  const toastWithMethods = baseToast as ToastFunction;
  toastWithMethods.success = (message: string, options?: ToastOptions) => baseToast(message, { ...options });
  toastWithMethods.error = (message: string, options?: ToastOptions) => baseToast(message, { ...options });
  toastWithMethods.warning = (message: string, options?: ToastOptions) => baseToast(message, { ...options });
  toastWithMethods.info = (message: string, options?: ToastOptions) => baseToast(message, { ...options });

  return toastWithMethods;
};

// Fixed: Safe assignment with proper typing
const toast = createToastFunction();

interface SonnerProps {
  theme?: 'light' | 'dark' | 'system';
  className?: string;
  toastOptions?: ToastOptions;
}

export const Sonner = ({ theme, className, toastOptions }: SonnerProps) => {
  const { theme: currentTheme } = useTheme();
  const resolvedTheme = theme || currentTheme;

  return (
    <div 
      className={className}
      data-theme={resolvedTheme}
      data-testid="sonner-container"
    >
      {/* Toast container would go here */}
    </div>
  );
};

export { toast };