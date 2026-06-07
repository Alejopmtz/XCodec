'use client'

import { useEffect } from 'react'
import { X, Users } from 'lucide-react'
import type { OnlineUser } from '@/types/chat'

// ── Helpers ────────────────────────────────────────────────────
// Duplicados de OnlineUsersList intencionalmente para mantener
// cada componente independiente y sin acoplamiento de módulo.

const AVATAR_COLORS = [
  '#58a6ff', '#3fb950', '#d29922', '#bc8cff',
  '#f78166', '#39d4a5', '#e3b341', '#ff7b72',
]

function getColor(username: string): string {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ── Componente ─────────────────────────────────────────────────

interface UsersDrawerProps {
  open: boolean
  onClose: () => void
  users: OnlineUser[]
  currentUserId: string
}

export function UsersDrawer({ open, onClose, users, currentUserId }: UsersDrawerProps) {

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Bloquear scroll del body mientras el drawer está abierto en móvil
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────── */}
      {/*
       * md:hidden: en desktop el drawer nunca se muestra porque el
       * sidebar ya es visible. El backdrop tampoco debe aparecer.
       */}
      <div
        className={`fixed inset-0 z-40 bg-base/70 backdrop-blur-sm md:hidden
          transition-opacity duration-200
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel deslizante ──────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-64 flex-col
          border-l border-border bg-surface md:hidden
          transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Usuarios online"
      >
        {/* ── Cabecera del drawer ───────────────────────────── */}
        <div className="flex h-10 shrink-0 items-center border-b border-border px-4 gap-2">
          <Users
            size={13}
            className={users.length > 0 ? 'text-signal-green' : 'text-text-muted'}
            style={
              users.length > 0
                ? { filter: 'drop-shadow(0 0 4px rgba(63,185,80,0.4))' }
                : undefined
            }
          />
          <span className="flex-1 font-mono text-2xs uppercase tracking-[0.1em] text-text-muted">
            Online
          </span>
          <span className="font-mono text-2xs tabular-nums text-text-secondary">
            {users.length}
          </span>
          <button
            onClick={onClose}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded hover:bg-raised transition-colors"
            title="Cerrar"
          >
            <X size={14} className="text-text-muted" />
          </button>
        </div>

        {/* ── Lista de usuarios ─────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto py-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#30363d transparent' }}
        >
          {users.length === 0 ? (
            <p className="px-4 py-3 font-mono text-xs text-text-muted italic">
              Sin usuarios online
            </p>
          ) : (
            users.map((user) => {
              const color    = getColor(user.username)
              const initials = getInitials(user.displayName)
              const isSelf   = user.userId === currentUserId

              return (
                <div
                  key={user.userId}
                  className="flex items-center gap-2.5 px-4 py-2"
                >
                  {/* Avatar con indicador online */}
                  <span
                    className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-mono font-semibold select-none"
                    style={{
                      backgroundColor: color + '20',
                      color,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    {initials}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface bg-signal-green"
                      style={{ boxShadow: '0 0 4px rgba(63,185,80,0.7)' }}
                    />
                  </span>

                  {/* Nombre y username */}
                  <div className="min-w-0">
                    <span className="block font-mono text-xs text-text truncate leading-tight">
                      {user.displayName}
                    </span>
                    <span className="block font-mono text-2xs text-text-muted truncate">
                      @{user.username}{isSelf ? ' (tú)' : ''}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
