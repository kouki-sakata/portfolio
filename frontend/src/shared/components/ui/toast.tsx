// Toast compatibility wrapper for sonner
// This file provides backward compatibility with the deprecated toast component
// Uses sonner under the hood

import { toast as sonnerToast } from 'sonner'

// Re-export toast functionality through the central exports file
export { toast, Toaster } from './toast-exports'

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

interface SonnerOptions {
  description?: string
  duration?: number
}

// Provide a hook-like interface for tests
export const useToast = () => {

  return {
    toast: (options: ToastOptions) => {
      const { title, description, variant, duration } = options

      // Map to sonner API
      const message = title ?? ''
      const sonnerOptions: SonnerOptions = {
        description,
        duration: duration ?? 4000,
      }

      if (variant === 'destructive') {
        return sonnerToast.error(message, sonnerOptions)
      }

      return sonnerToast(message, sonnerOptions)
    },
    dismiss: (toastId?: string | number) => {
      if (toastId) {
        sonnerToast.dismiss(toastId)
      } else {
        sonnerToast.dismiss()
      }
    },
  }
}