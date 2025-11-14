'use client'

import { create } from 'zustand'
import type { Toast } from '@/components/ui/toast-notification'

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7)
    const newToast = { ...toast, id }

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    // Auto remove after duration
    if (toast.duration) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, toast.duration)
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  clearAll: () => set({ toasts: [] }),
}))

export function useToast() {
  const { addToast, removeToast, clearAll } = useToastStore()

  return {
    toast: (options: Omit<Toast, 'id'>) => addToast(options),
    success: (title: string, description?: string) =>
      addToast({ title, description, type: 'success', duration: 5000 }),
    error: (title: string, description?: string) =>
      addToast({ title, description, type: 'error', duration: 5000 }),
    info: (title: string, description?: string) =>
      addToast({ title, description, type: 'info', duration: 5000 }),
    warning: (title: string, description?: string) =>
      addToast({ title, description, type: 'warning', duration: 5000 }),
    dismiss: removeToast,
    dismissAll: clearAll,
  }
}
