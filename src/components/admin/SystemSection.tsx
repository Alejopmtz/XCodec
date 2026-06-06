'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ClearChatModal } from './ClearChatModal'

export function SystemSection() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="space-y-4">

        {/* ── Cabecera de sección ──────────────────────────── */}
        <div>
          <h2 className="font-mono font-semibold text-base text-text tracking-wide">
            Sistema
          </h2>
          <p className="font-mono text-xs text-text-muted mt-0.5">
            Operaciones administrativas globales
          </p>
        </div>

        {/* ── Divisor ──────────────────────────────────────── */}
        <div className="h-px bg-border-subtle" />

        {/* ── Tarjeta: Limpiar historial ───────────────────── */}
        <div className="rounded-lg border border-border bg-surface p-5 flex items-center justify-between gap-6">
          <div className="space-y-1 min-w-0">
            <p className="font-mono text-sm text-text font-medium">
              Limpiar historial de chat
            </p>
            <p className="font-mono text-xs text-text-muted leading-relaxed">
              Elimina permanentemente todos los mensajes del sistema.
              Los usuarios conectados verán el chat vacío de inmediato.
              Esta acción es irreversible.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className={[
              'shrink-0 inline-flex items-center gap-2 rounded-md',
              'border border-signal-red/25 bg-signal-red/8',
              'px-3 py-2 font-mono text-xs text-signal-red',
              'hover:bg-signal-red/15 transition-colors duration-150',
            ].join(' ')}
          >
            <Trash2 size={13} />
            Limpiar historial
          </button>
        </div>

      </div>

      {showModal && (
        <ClearChatModal onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
