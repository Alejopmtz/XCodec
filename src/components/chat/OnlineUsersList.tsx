'use client'

import { useState } from 'react'
import { Users, ChevronRight } from 'lucide-react'
import type { OnlineUser } from '@/types/chat'

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

interface OnlineUsersListProps {
  users: OnlineUser[]
  currentUserId: string
  /**
   * Clases adicionales aplicadas al <aside>.
   * Usado desde ChatShell para controlar visibilidad responsiva:
   *   "hidden md:flex" → oculto en móvil, visible en desktop como sidebar.
   */
  className?: string
}

export function OnlineUsersList({ users, currentUserId, className }: OnlineUsersListProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`shrink-0 border-l border-border bg-surface flex flex-col transition-all duration-200 ${
        collapsed ? 'w-10' : 'w-52'
      } ${className ?? ''}`}
    >
      {/* ── Cabecera ─────────────────────────────────────────── */}
      <div
        className="flex h-10 shrink-0 items-center border-b border-border px-3 gap-2 cursor-pointer select-none hover:bg-raised/40 transition-colors"
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? 'Expandir' : 'Colapsar'}
      >
        <Users
          size={13}
          className={`shrink-0 ${users.length > 0 ? 'text-signal-green' : 'text-text-muted'}`}
          style={users.length > 0 ? { filter: 'drop-shadow(0 0 4px rgba(63,185,80,0.4))' } : undefined}
        />

        {!collapsed && (
          <>
            <span className="flex-1 font-mono text-2xs uppercase tracking-[0.1em] text-text-muted">
              Online
            </span>
            <span className="font-mono text-2xs tabular-nums text-text-secondary">
              {users.length}
            </span>
          </>
        )}

        <ChevronRight
          size={12}
          className={`shrink-0 text-text-muted transition-transform duration-200 ${
            collapsed ? '' : 'rotate-180'
          }`}
        />
      </div>

      {/* ── Lista de usuarios ────────────────────────────────── */}
      {!collapsed && (
        <div
          className="flex-1 overflow-y-auto py-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#30363d transparent' }}
        >
          {users.length === 0 ? (
            <p className="px-3 py-2 font-mono text-xs text-text-muted italic">
              Sin usuarios
            </p>
          ) : (
            users.map((user) => {
              const color   = getColor(user.username)
              const initials = getInitials(user.displayName)
              const isSelf  = user.userId === currentUserId

              return (
                <div
                  key={user.userId}
                  className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-raised/40 transition-colors"
                >
                  {/* Avatar */}
                  <span
                    className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-mono font-semibold select-none"
                    style={{
                      backgroundColor: color + '20',
                      color,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    {initials}
                    {/* Punto online */}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface bg-signal-green"
                      style={{ boxShadow: '0 0 4px rgba(63,185,80,0.7)' }}
                    />
                  </span>

                  {/* Nombre */}
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
      )}
    </aside>
  )
}
