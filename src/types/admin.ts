// ── Fila completa de usuario para el panel admin ─────────────
export type UserWithStatus = {
  id: string
  username: string
  display_name: string
  is_admin: boolean
  is_active: boolean
  password_set: boolean
  last_seen: string | null
  created_at: string
  setup_token: string | null
}

export type UserStatus = 'active' | 'pending' | 'inactive'

export function getUserStatus(
  user: Pick<UserWithStatus, 'is_active' | 'password_set'>
): UserStatus {
  if (!user.is_active) return 'inactive'
  if (!user.password_set) return 'pending'
  return 'active'
}

// ── Formatters ────────────────────────────────────────────────

export function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return '—'
  const diff = Date.now() - new Date(lastSeen).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'Ahora'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  return new Date(lastSeen).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  })
}

export function formatCreatedAt(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}
