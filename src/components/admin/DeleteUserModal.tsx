'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react'
import { deleteUser } from '@/actions/users'
import { useToastStore } from '@/store/toastStore'
import type { UserWithStatus } from '@/types/admin'

interface DeleteUserModalProps {
  user: UserWithStatus
  /** Cierra el modal (sin refrescar). */
  onClose: () => void
  /** Llamado tras borrado exitoso → el padre hace router.refresh(). */
  onDeleted: () => void
}

const CONFIRM_TEXT = 'ELIMINAR USUARIO'

export function DeleteUserModal({
  user,
  onClose,
  onDeleted,
}: DeleteUserModalProps) {
  const [input,      setInput]      = useState('')
  const [formError,  setFormError]  = useState<string | null>(null)
  const [isPending,  setIsPending]  = useState(false)

  const showToast = useToastStore((s) => s.showToast)

  const isConfirmed = input === CONFIRM_TEXT

  async function handleConfirm() {
    if (!isConfirmed || isPending) return
    setFormError(null)
    setIsPending(true)

    try {
      const result = await deleteUser(user.id)

      if (!result.success) {
        setFormError(result.error ?? 'Error desconocido')
        return
      }

      showToast('success', `Usuario @${user.username} eliminado`)
      onDeleted()
      onClose()
    } catch (err) {
      console.error('[DeleteUserModal]', err)
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
            <Trash2 size={15} className="text-signal-red" />
            <h2 className="font-mono font-semibold text-sm tracking-wide text-text">
              ELIMINAR USUARIO
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

          {/* Aviso de irreversibilidad */}
          <div className="flex items-start gap-3 rounded-lg border border-signal-amber/20 bg-signal-amber/5 px-4 py-3">
            <AlertTriangle size={14} className="shrink-0 text-signal-amber mt-0.5" />
            <p className="font-mono text-xs text-text-secondary leading-relaxed">
              Esta acción es{' '}
              <span className="text-signal-amber font-semibold">permanente</span>.
              El usuario perderá el acceso de inmediato y no podrá reactivar su
              cuenta. Los mensajes históricos se conservan.
            </p>
          </div>

          {/* Datos del usuario */}
          <div className="rounded-lg border border-border bg-raised px-4 py-3 space-y-0.5">
            <p className="font-mono text-2xs text-text-muted uppercase tracking-[0.08em] mb-2">
              Usuario a eliminar
            </p>
            <p className="font-mono text-sm text-text">
              @{user.username}
            </p>
            <p className="font-mono text-xs text-text-secondary">
              {user.display_name}
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
                <Trash2 size={14} />
                Eliminar usuario
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
