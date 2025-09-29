// Fixed: Separate toast function to resolve React refresh warning
type ToastOptions = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  cancel?: React.ReactNode;
  id?: string;
  dismissible?: boolean;
  onDismiss?: (id: string) => void;
  onAutoClose?: (id: string) => void;
};

type ToastFunction = {
  (message: string, options?: ToastOptions): string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
};

// Fixed: Proper mock implementation with type safety
const createToastFunction = (): ToastFunction => {
  const baseToast = (_message: string, _options?: ToastOptions): string =>
    "toast-id";

  // Fixed: Safe assignment with proper typing
  const toastWithMethods = baseToast as ToastFunction;
  toastWithMethods.success = (message: string, options?: ToastOptions) =>
    baseToast(message, { ...options });
  toastWithMethods.error = (message: string, options?: ToastOptions) =>
    baseToast(message, { ...options });
  toastWithMethods.warning = (message: string, options?: ToastOptions) =>
    baseToast(message, { ...options });
  toastWithMethods.info = (message: string, options?: ToastOptions) =>
    baseToast(message, { ...options });

  return toastWithMethods;
};

// Fixed: Safe assignment with proper typing
export const toast = createToastFunction();
