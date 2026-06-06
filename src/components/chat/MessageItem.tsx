'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteMessage } from '@/actions/chat'
import { useChatStore } from '@/store/chatStore'
import type { MessageWithSender } from '@/types/chat'

// Paleta de colores por índice de hash (igual que getUserColor en admin)
const USERNAME_COLORS = [
  '#58a6ff', // azul
  '#3fb950', // verde
  '#d29922', // ámbar
  '#bc8cff', // violeta
  '#f78166', // salmón
  '#39d4a5', // turquesa
  '#e3b341', // dorado
  '#ff7b72', // rojo suave
]

function getUsernameColor(username: string): string {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return USERNAME_COLORS[Math.abs(hash) % USERNAME_COLORS.length]!
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

interface MessageItemProps {
  message: MessageWithSender
  isOwn: boolean
  isAdmin: boolean   // admin viewer (puede borrar cualquier mensaje)
}

export function MessageItem({ message, isOwn, isAdmin }: MessageItemProps) {
  const [isPending, startTransition] = useTransition()
  const [hover, setHover] = useState(false)
  const markDeleted = useChatStore((s) => s.markDeleted)

  const color    = getUsernameColor(message.sender_username)
  const initials = getInitials(message.sender_display_name)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMessage(message.id)
      if (result.success) markDeleted(message.id)
    })
  }

  if (message.is_deleted) {
    return (
      <div className="flex gap-3 px-4 py-1.5 group">
        <div className="h-7 w-7 shrink-0" />
        <span className="font-mono text-xs italic text-text-muted select-none">
          [mensaje eliminado]
        </span>
      </div>
    )
  }

  return (
    <div
      className="flex gap-3 px-4 py-1.5 group hover:bg-raised/30 transition-colors duration-75 rounded"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* ── Avatar ──────────────────────────────────────────── */}
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-mono font-semibold select-none mt-0.5"
        style={{
          backgroundColor: color + '20',
          color,
          border: `1px solid ${color}30`,
        }}
      >
        {initials}
      </span>

      {/* ── Cuerpo ──────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Encabezado */}
        <div className="flex items-baseline gap-2 mb-0.5">
          <span
            className="font-mono font-semibold text-xs leading-none"
            style={{ color }}
          >
            {message.sender_display_name}
          </span>

          {/* Badge usuario propio */}
          {isOwn && (
            <span className="font-mono text-2xs text-text-muted">(tú)</span>
          )}

          <span className="font-mono text-2xs text-text-muted tabular-nums">
            {formatTime(message.created_at)}
          </span>

          {/* Acción eliminar — solo visible para admin al hacer hover */}
          {isAdmin && hover && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-2xs text-signal-red/60 hover:text-signal-red hover:bg-signal-red/8 transition-colors duration-100"
              title="Eliminar mensaje"
            >
              {isPending ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Trash2 size={11} />
              )}
            </button>
          )}
        </div>

        {/* Contenido */}
        <p className="font-mono text-sm text-text leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </p>

      </div>
    </div>
  )
}
