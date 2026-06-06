'use client'

import { useState } from 'react'
import { Check, Copy, KeyRound, User, X } from 'lucide-react'

interface NewUserModalProps {
  username: string
  setupToken: string
  onClose: () => void
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      onClick={handleCopy}
      className="xc-btn-ghost h-7 w-7 p-0 flex items-center justify-center shrink-0"
      title="Copiar"
    >
      {copied ? (
        <Check size={13} className="text-signal-green" />
      ) : (
        <Copy size={13} className="text-text-muted" />
      )}
    </button>
  )
}

export function NewUserModal({ username, setupToken, onClose }: NewUserModalProps) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel */}
      <div className="xc-card w-full max-w-md animate-slide-up">

        {/* ── Cabecera ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <KeyRound size={16} className="text-signal-green" />
            <h2 className="font-mono font-semibold text-sm tracking-wide text-text">
              USUARIO CREADO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="xc-btn-ghost h-7 w-7 p-0 flex items-center justify-center"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Cuerpo ────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-4">
          <p className="font-mono text-xs text-text-muted leading-relaxed">
            Comparte estas credenciales con el usuario de forma segura.
            El código de activación expira en{' '}
            <span className="text-signal-amber">7 días</span>.
          </p>

          {/* Username */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <User size={12} className="text-text-muted" />
              <span className="font-mono text-2xs text-text-muted uppercase tracking-[0.08em]">
                Username
              </span>
            </div>
            <div className="flex items-center gap-2 rounded border border-border bg-raised px-3 py-2.5">
              <span className="flex-1 font-mono text-sm text-signal-blue select-all">
                @{username}
              </span>
              <CopyButton value={username} />
            </div>
          </div>

          {/* Setup token */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <KeyRound size={12} className="text-text-muted" />
              <span className="font-mono text-2xs text-text-muted uppercase tracking-[0.08em]">
                Código de activación
              </span>
            </div>
            <div className="flex items-center gap-2 rounded border border-signal-green/25 bg-signal-green/5 px-3 py-2.5">
              <span className="flex-1 font-mono text-sm text-signal-green tracking-[0.15em] select-all">
                {setupToken}
              </span>
              <CopyButton value={setupToken} />
            </div>
          </div>

          {/* Instrucciones */}
          <div className="rounded border border-border-subtle bg-raised px-4 py-3 space-y-1">
            <p className="font-mono text-2xs text-text-muted uppercase tracking-[0.08em] mb-2">
              Instrucciones de acceso
            </p>
            <ol className="space-y-1 list-decimal list-inside">
              {[
                'Abrir la aplicación XCodec',
                'Hacer clic en "¿Primer acceso?"',
                'Introducir el username y el código de activación',
                'Elegir una contraseña propia',
              ].map((step, i) => (
                <li key={i} className="font-mono text-xs text-text-secondary">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Pie ───────────────────────────────────────────── */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="xc-btn-primary w-full text-sm py-2"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  )
}
