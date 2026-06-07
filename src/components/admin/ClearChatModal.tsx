'use client'

import { useState } from 'react'
import { AlertTriangle, MessageSquareX, X, Loader2 } from 'lucide-react'
import { clearAllMessages } from '@/actions/chat'
import { useToastStore } from '@/store/toastStore'

interface ClearChatModalProps {
  onClose: () => void
}

const CONFIRM_TEXT = 'ELIMINAR CHAT'

export function ClearChatModal({ onClose }: ClearChatModalProps) {
  const [input,     setInput]     = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const showToast = useToastStore((s) => s.showToast)

  const isConfirmed = input === CONFIRM_TEXT

  async function handleConfirm() {
    if (!isConfirmed || isPending) return
    setFormError(null)
    setIsPending(true)

    try {
      const result = await clearAllMessages()

      if (!result.success) {
        setFormError(result.error ?? 'Error desconocido')
        return
      }

      // La señal de sincronización (chat_cleared) ya fue emitida
      // por PostgreSQL vía WAL al confirmar la transacción de la RPC.
      // No se requiere ninguna acción adicional en el cliente.
      showToast('success', 'Historial de chat eliminado correctamente')
      onClose()
    } catch (err) {
      console.error('[ClearChatModal]', err)
      setFormError('Error inesperado. Intenta de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !isPending) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="xc-card w-full max-w-md animate-slide-up">

        {/* ── Cabecera ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <MessageSquareX size={15} className="text-signal-red" />
            <h2 className="font-mono font-semibold text-sm tracking-wide text-text">
              LIMPIAR HISTORIAL
            </h2>
          </div>
          {!isPending && (
            <button
              onClick={onClose}
              className="xc-btn-ghost h-7 w-7 p-0 flex items-center justify-center"
              aria-label="Cerrar"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Cuerpo ────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-4">

          {/* Aviso de destrucción total */}
          <div className="flex items-start gap-3 rounded-lg border border-signal-red/20 bg-signal-red/5 px-4 py-3">
            <AlertTriangle size={14} className="shrink-0 text-signal-red mt-0.5" />
            <p className="font-mono text-xs text-text-secondary leading-relaxed">
              Se eliminarán{' '}
              <span className="text-signal-red font-semibold">todos los mensajes</span>{' '}
              del sistema de forma{' '}
              <span className="text-signal-red font-semibold">permanente e irreversible</span>.
              Los usuarios conectados verán el chat vacío de inmediato.
            </p>
          </div>

          {/* Campo de confirmación */}
          <div className="space-y-1.5">
            <label className="xc-label">
              Escribe{' '}
              <span className="text-signal-red font-semibold tracking-[0.06em]">
                {CONFIRM_TEXT}
              </span>{' '}
              para confirmar
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                if (formError) setFormError(null)
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
              disabled={isPending}
              placeholder={CONFIRM_TEXT}
              className="xc-input"
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Error de acción */}
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded border border-signal-red/20 bg-signal-red/5 px-3 py-2.5 animate-fade-in"
            >
              <span className="mt-px shrink-0 text-signal-red text-sm">✗</span>
              <span className="text-signal-red text-xs font-mono">{formError}</span>
            </div>
          )}

        </div>

        {/* ── Pie ───────────────────────────────────────────── */}
        <div className="px-6 pb-5 flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="xc-btn-secondary flex-1 text-sm py-2"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmed || isPending}
            className={[
              'flex-1 inline-flex items-center justify-center gap-2 rounded-md',
              'px-4 py-2 font-mono font-semibold text-sm',
              'bg-signal-red text-[#0d1117]',
              'hover:opacity-90 transition-opacity duration-150',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            ].join(' ')}
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <MessageSquareX size={14} />
                Limpiar historial
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
