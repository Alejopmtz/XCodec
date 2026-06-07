'use client'

import Link from 'next/link'
import { ShieldCheck, Terminal, LogOut } from 'lucide-react'
import { signOut } from '@/actions/auth'

interface ChatHeaderProps {
  displayName: string
  isAdmin: boolean
  onlineCount: number
}

export function ChatHeader({ displayName, isAdmin, onlineCount }: ChatHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border bg-surface">

      {/*
       * Espaciador de safe-area superior.
       * En iPhone con notch / Dynamic Island, este div ocupa exactamente
       * env(safe-area-inset-top) (≈47px en iPhone 14 Pro) para que el
       * contenido del header no quede bajo la isla de hardware.
       * En cualquier otro dispositivo env() devuelve 0 → altura 0 → invisible.
       */}
      <div className="chat-header-safe" />

      {/* ── Fila de contenido ────────────────────────────────── */}
      <div className="h-10 flex items-center px-4 gap-3">

      {/* ── Marca ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <Terminal
          size={15}
          className="text-signal-green"
          style={{ filter: 'drop-shadow(0 0 5px rgba(63,185,80,0.4))' }}
        />
        <span className="font-mono font-bold text-xs tracking-[0.14em] text-text">
          XCODEC
        </span>
      </div>

      {/* Canal */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-2xs text-text-muted">/</span>
        <span className="font-mono text-xs text-signal-green tracking-wide">
          #global
        </span>
      </div>

      {/* Indicador online */}
      <div className="flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full bg-signal-green"
          style={{ boxShadow: '0 0 5px rgba(63,185,80,0.7)' }}
        />
        <span className="font-mono text-2xs text-text-muted tabular-nums">
          {onlineCount} online
        </span>
      </div>

      <div className="flex-1" />

      {/* ── Usuario actual ────────────────────────────────────── */}
      <span className="font-mono text-xs text-text-secondary hidden sm:block">
        {displayName}
      </span>

      {/* Badge Admin */}
      {isAdmin && (
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono font-medium text-2xs uppercase tracking-[0.08em] bg-signal-gold/10 text-signal-gold border border-signal-gold/25 hover:bg-signal-gold/15 transition-colors"
        >
          <ShieldCheck size={10} />
          Admin
        </Link>
      )}

      {/* Logout */}
      <form action={signOut}>
        <button
          type="submit"
          className="xc-btn-ghost flex items-center gap-1.5 text-xs px-2 py-1"
          title="Salir"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </form>

      </div>{/* /fila de contenido */}
    </header>
  )
}
