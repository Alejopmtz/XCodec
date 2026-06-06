'use client'

import Link from 'next/link'
import { ShieldCheck, MessageSquare, LogOut } from 'lucide-react'
import { signOut } from '@/actions/auth'

export function AdminHeader() {
  return (
    <header className="h-header shrink-0 border-b border-border bg-surface flex items-center px-6 gap-4">

      {/* ── Marca ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5">
        <ShieldCheck
          size={17}
          className="text-signal-green"
          style={{ filter: 'drop-shadow(0 0 6px rgba(63,185,80,0.35))' }}
        />
        <span className="font-sans font-bold text-sm tracking-[0.12em] text-text">
          XCODEC
        </span>
      </div>

      {/* Badge Admin */}
      <span className="inline-flex items-center rounded px-2 py-0.5 font-mono font-medium text-2xs uppercase tracking-[0.1em] bg-signal-gold/10 text-signal-gold border border-signal-gold/25">
        ADMIN
      </span>

      <div className="flex-1" />

      {/* ── Navegación ──────────────────────────────────────── */}
      <Link
        href="/chat"
        className="xc-btn-ghost flex items-center gap-2 text-xs"
      >
        <MessageSquare size={14} />
        Ir al chat
      </Link>

      <div className="h-4 w-px bg-border" />

      <form action={signOut}>
        <button
          type="submit"
          className="xc-btn-ghost flex items-center gap-2 text-xs"
        >
          <LogOut size={14} />
          Salir
        </button>
      </form>

    </header>
  )
}
