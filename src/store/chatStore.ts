import { create } from 'zustand'
import type { MessageWithSender } from '@/types/chat'

interface ChatState {
  // ── Mensajes ──────────────────────────────────────────────────
  messages: MessageWithSender[]
  hasMore: boolean
  oldestCursor: string | null
  isLoadingMore: boolean

  // ── Acciones ─────────────────────────────────────────────────
  setMessages: (messages: MessageWithSender[]) => void
  prependMessages: (messages: MessageWithSender[]) => void
  appendMessage: (message: MessageWithSender) => void
  markDeleted: (messageId: string) => void
  setHasMore: (hasMore: boolean) => void
  setOldestCursor: (cursor: string | null) => void
  setIsLoadingMore: (loading: boolean) => void
  reset: () => void
}

const INITIAL_STATE = {
  messages: [] as MessageWithSender[],
  hasMore: false,
  oldestCursor: null as string | null,
  isLoadingMore: false,
}

export const useChatStore = create<ChatState>((set) => ({
  ...INITIAL_STATE,

  setMessages: (messages) => set({ messages }),

  prependMessages: (older) =>
    set((state) => ({ messages: [...older, ...state.messages] })),

  appendMessage: (msg) =>
    set((state) => {
      if (state.messages.some((m) => m.id === msg.id)) return state
      return { messages: [...state.messages, msg] }
    }),

  markDeleted: (id) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, is_deleted: true } : m
      ),
    })),

  setHasMore: (hasMore) => set({ hasMore }),
  setOldestCursor: (cursor) => set({ oldestCursor: cursor }),
  setIsLoadingMore: (isLoadingMore) => set({ isLoadingMore }),

  reset: () => set(INITIAL_STATE),
}))
