'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { useOnlineUsers } from '@/hooks/useOnlineUsers'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { OnlineUsersList } from './OnlineUsersList'
import type { MessageWithSender } from '@/types/chat'

const PAGE_SIZE = 50

interface ChatShellProps {
  initialMessages: MessageWithSender[]
  currentUserId: string
  currentUsername: string
  currentDisplayName: string
  isAdmin: boolean
}

export function ChatShell({
  initialMessages,
  currentUserId,
  currentUsername,
  currentDisplayName,
  isAdmin,
}: ChatShellProps) {
  const {
    setMessages,
    setHasMore,
    setOldestCursor,
    reset,
  } = useChatStore()

  // ── Inicializar store con datos del servidor ──────────────
  useEffect(() => {
    // La función devuelve mensajes en DESC; los invertimos a ASC para el UI
    const sorted = [...initialMessages].reverse()
    setMessages(sorted)
    setHasMore(initialMessages.length === PAGE_SIZE)
    setOldestCursor(sorted[0]?.created_at ?? null)

    return () => { reset() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Realtime: mensajes nuevos ─────────────────────────────
  useRealtimeMessages()

  // ── Presence: usuarios online ─────────────────────────────
  const { onlineUsers } = useOnlineUsers({
    userId:      currentUserId,
    username:    currentUsername,
    displayName: currentDisplayName,
  })

  // ── Heartbeat: actualizar last_seen cada 30 s ─────────────
  useEffect(() => {
    async function beat() {
      await fetch('/api/heartbeat', { method: 'POST' })
    }
    beat() // inmediatamente al montar
    const id = setInterval(beat, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex h-screen flex-col bg-base overflow-hidden">

      {/* ── Header ──────────────────────────────────────────── */}
      <ChatHeader
        displayName={currentDisplayName}
        isAdmin={isAdmin}
        onlineCount={onlineUsers.length}
      />

      {/* ── Cuerpo: mensajes + sidebar ───────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Panel principal */}
        <div className="flex flex-1 flex-col min-w-0">
          <MessageList
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isInitialLoading={false}
          />
          <MessageInput />
        </div>

        {/* Sidebar usuarios online */}
        <OnlineUsersList
          users={onlineUsers}
          currentUserId={currentUserId}
        />

      </div>

    </div>
  )
}
