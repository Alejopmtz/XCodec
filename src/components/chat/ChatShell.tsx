'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/store/chatStore'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { useRealtimeSystem }   from '@/hooks/useRealtimeSystem'
import { useOnlineUsers } from '@/hooks/useOnlineUsers'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { OnlineUsersList } from './OnlineUsersList'
import { UsersDrawer } from './UsersDrawer'
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

  // ── Realtime: eventos de sistema (chat_cleared, etc.) ─────
  // Cuando el admin limpia el historial, todos los clientes
  // reciben el broadcast y vacían su store inmediatamente.
  useRealtimeSystem()

  // ── Presence: usuarios online ─────────────────────────────
  const { onlineUsers } = useOnlineUsers({
    userId:      currentUserId,
    username:    currentUsername,
    displayName: currentDisplayName,
  })

  // ── Drawer de usuarios online (solo móvil) ───────────────
  const [drawerOpen, setDrawerOpen] = useState(false)

  const router = useRouter()

  // ── Heartbeat: actualizar last_seen cada 30 s ─────────────
  // También detecta si el admin desactivó al usuario durante la sesión:
  // si el servidor responde 401, la sesión se destruyó server-side y
  // redirigimos a /login inmediatamente (máx. 30 s de lag).
  useEffect(() => {
    async function beat() {
      try {
        const res = await fetch('/api/heartbeat', { method: 'POST' })
        if (res.status === 401) {
          router.replace('/login')
        }
      } catch {
        // Fallo de red — no redirigir, reintentar en el siguiente ciclo
      }
    }
    beat()
    const id = setInterval(beat, 30_000)
    return () => clearInterval(id)
  }, [router])

  // ── Bloquear scroll del body mientras el chat está montado ──
  //
  // Problema: body tiene altura determinada por el documento. En iOS Safari,
  // cuando el usuario toca el textarea, el navegador hace scroll automático
  // del body para centrar el input sobre el teclado. Aunque el ChatShell
  // tiene h-dvh, el body puede scrollear más que eso, desplazando el
  // ChatShell fuera de pantalla y ocultando el header.
  //
  // Solución: overflow:hidden en el body impide ese scroll mientras el chat
  // está activo. Se restaura al desmontar para no afectar otras páginas.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    // overflow-hidden eliminado: causaba que los elementos con
    // position:fixed (UsersDrawer) se posicionaran relativo a este
    // contenedor en lugar del viewport, disparando un bug de compositing
    // de iOS Safari que desalineaba el layout completo al abrir el teclado.
    // h-dvh es suficiente para contener la altura — los hijos con
    // flex-1 + min-h-0 + overflow-y-auto manejan su propio scroll.
    <div className="flex h-dvh flex-col bg-base">

      {/* ── Header ──────────────────────────────────────────── */}
      <ChatHeader
        displayName={currentDisplayName}
        isAdmin={isAdmin}
        onlineCount={onlineUsers.length}
        onOpenUsersDrawer={() => setDrawerOpen(true)}
      />

      {/* ── Cuerpo: mensajes + sidebar ───────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Panel principal — ocupa 100% en móvil, resto en desktop */}
        <div className="flex flex-1 flex-col min-w-0">
          <MessageList
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isInitialLoading={false}
          />
          <MessageInput
            currentUserId={currentUserId}
            currentUsername={currentUsername}
            currentDisplayName={currentDisplayName}
          />
        </div>

        {/*
         * Sidebar usuarios online.
         * hidden en móvil → los usuarios acceden al drawer desde el header.
         * flex en md+ → layout de dos columnas en tablet y desktop.
         */}
        <OnlineUsersList
          users={onlineUsers}
          currentUserId={currentUserId}
          className="hidden md:flex"
        />

      </div>

      {/*
       * Drawer móvil de usuarios online.
       * El componente se renderiza siempre pero el panel permanece
       * translate-x-full (fuera de pantalla) cuando open=false.
       * md:hidden interno garantiza que nunca aparezca en desktop.
       */}
      <UsersDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        users={onlineUsers}
        currentUserId={currentUserId}
      />

    </div>
  )
}
