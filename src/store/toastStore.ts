import { create } from 'zustand'

export type ToastType = 'success' | 'error'

interface ToastState {
  toast: { type: ToastType; message: string } | null
  showToast: (type: ToastType, message: string) => void
  hideToast: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toast:     null,
  showToast: (type, message) => set({ toast: { type, message } }),
  hideToast: () => set({ toast: null }),
}))
