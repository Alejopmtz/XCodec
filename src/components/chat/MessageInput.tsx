'use client'

import { useRef, useState, useTransition, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { sendMessage } from '@/actions/chat'
import { useChatStore } from '@/store/chatStore'

const MAX_LENGTH = 2000

interface MessageInputProps {
  currentUserId:      string
  currentUsername:    string
  currentDisplayName: string
}

export function MessageInput({
  currentUserId,
  currentUsername,
  currentDisplayName,
}: MessageInputProps) {
  const [value, setValue]               = useState('')
  const [error, setError]               = useState<string | null>(null)
  const [isPending, startTransition]    = useTransition()
  const textareaRef                     = useRef<HTMLTextAreaElement>(null)

  const appendMessage     = useChatStore((s) => s.appendMessage)
  const replaceOptimistic = useChatStore((s) => s.replaceOptimistic)
  const removeMessage     = useChatStore((s) => s.removeMessage)

  const remaining = MAX_LENGTH - value.length
  const canSend   = value.trim().length > 0 && !isPending

  // Auto-resize del textarea
  function resize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const submit = useCallback(() => {
    const content = value.trim()
    if (!content || isPending) return

    setError(null)
    const snapshot = content
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }

    // ── Optimistic UI ─────────────────────────────────────────
    // Añadir el mensaje al store de forma inmediata, antes de
    // esperar la respuesta del servidor. El usuario ve su mensaje
    // al instante (0 ms de latencia percibida).
    //
    // Usamos crypto.randomUUID() como ID temporal. Cuando la Server
    // Action responde con el UUID real asignado por PostgreSQL,
    // replaceOptimistic() sustituye el temp por el real. Cuando
    // Supabase Realtime entrega el INSERT con el ID real,
    // appendMessage() lo ignora por el dedup existente.
    const tempId = crypto.randomUUID()
    appendMessage({
      id:                  tempId,
      content:             snapshot,
      sender_id:           currentUserId,
      is_deleted:          false,
      created_at:          new Date().toISOString(),
      sender_username:     currentUsername,
      sender_display_name: currentDisplayName,
    })

    startTransition(async () => {
      const result = await sendMessage(snapshot)

      if (!result.success) {
        // Rollback: quitar el mensaje optimista y restaurar el input
        removeMessage(tempId)
        setError(result.error ?? 'Error al enviar')
        setValue(snapshot)
        textareaRef.current?.focus()
        return
      }

      // Reemplazar el ID temporal por el real del servidor.
      // Garantiza que el dedup de Realtime funcione correctamente:
      // cuando el evento INSERT llega, appendMessage() detecta
      // que el ID ya existe y no duplica el mensaje.
      replaceOptimistic(tempId, result.id, result.created_at)
    })
  }, [
    value,
    isPending,
    currentUserId,
    currentUsername,
    currentDisplayName,
    appendMessage,
    replaceOptimistic,
    removeMessage,
  ])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (e.target.value.length <= MAX_LENGTH) {
      setValue(e.target.value)
      setError(null)
    }
    resize()
  }

  return (
    <div className="shrink-0 border-t border-border bg-surface px-4 pt-2 chat-input-safe">

      {/* Error de envío */}
      {error && (
        <p className="mb-2 font-mono text-xs text-signal-red">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">

        {/* ── Textarea ─────────────────────────────────────── */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Escribe un mensaje…"
            className="xc-input w-full resize-none overflow-y-auto leading-relaxed pr-2 py-2"
            style={{
              minHeight: '38px',
              maxHeight: '160px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#30363d transparent',
            }}
          />
        </div>

        {/* ── Botón enviar ─────────────────────────────────── */}
        <button
          onClick={submit}
          disabled={!canSend}
          className="xc-btn-primary h-[38px] w-[38px] shrink-0 flex items-center justify-center p-0 disabled:opacity-40"
          title="Enviar (Enter)"
        >
          {isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
        </button>

      </div>

      {/* Contador de caracteres — solo cuando se acerca al límite */}
      {remaining < 200 && (
        <p
          className={`mt-1.5 text-right font-mono text-2xs tabular-nums ${
            remaining < 50 ? 'text-signal-red' : 'text-text-muted'
          }`}
        >
          {remaining}
        </p>
      )}

    </div>
  )
}
