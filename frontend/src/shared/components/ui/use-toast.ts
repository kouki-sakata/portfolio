// Hook for toast notifications
import { toast } from 'sonner'

export interface Toast {
  id?: string | number
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const showToast = (options: Toast) => {
    const { title, description, variant, duration = 4000 } = options

    const message = title ?? ''
    const sonnerOptions = {
      description,
      duration,
    }

    if (variant === 'destructive') {
      return toast.error(message, sonnerOptions)
    }

    return toast(message, sonnerOptions)
  }

  return {
    toast: showToast,
    dismiss: (toastId?: string | number) => {
      if (toastId) {
        toast.dismiss(toastId)
      } else {
        toast.dismiss()
      }
    },
  }
}