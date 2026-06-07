'use client'

import { useRef, useState, useTransition, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { sendMessage } from '@/actions/chat'

const MAX_LENGTH = 2000

export function MessageInput() {
  const [value, setValue]     = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    // Resetear altura y devolver foco inmediatamente.
    // Se hace antes de startTransition para que el cursor nunca abandone
    // el textarea, incluso si isPending deshabilita temporalmente el botón.
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }

    startTransition(async () => {
      const result = await sendMessage(snapshot)
      if (!result.success) {
        setError(result.error ?? 'Error al enviar')
        setValue(snapshot) // restaurar si falla
      }
    })
  }, [value, isPending])

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
    <div className="shrink-0 border-t border-border bg-surface px-4 py-3">

      {/* Error de envío */}
      {error && (
        <p className="mb-2 font-mono text-xs text-signal-red">
          {error}
        </p>
      )}

      <div className="flex items-end gap-3">

        {/* ── Textarea ─────────────────────────────────────── */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter nueva línea)"
            className="xc-input w-full resize-none overflow-y-auto leading-relaxed pr-2 py-2 disabled:opacity-50"
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
