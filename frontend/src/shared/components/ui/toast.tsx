// Toast compatibility wrapper for sonner
// This file provides backward compatibility with the deprecated toast component
// Uses sonner under the hood

export { toast } from 'sonner'

// Re-export Toaster from sonner wrapper
export { Toaster } from './toaster'

// Provide a hook-like interface for tests
export const useToast = () => {
  // Import toast from sonner
  const { toast } = require('sonner')

  return {
    toast: (options: {
      title?: string
      description?: string
      variant?: 'default' | 'destructive'
      duration?: number
    }) => {
      const { title, description, variant, duration } = options

      // Map to sonner API
      const message = title || ''
      const sonnerOptions: any = {
        description,
        duration: duration || 4000,
      }

      if (variant === 'destructive') {
        return toast.error(message, sonnerOptions)
      }

      return toast(message, sonnerOptions)
    },
    dismiss: (toastId?: string | number) => {
      if (toastId) {
        toast.dismiss(toastId)
      } else {
        toast.dismiss()
      }
    },
  }
}