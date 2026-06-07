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
// Redirigen a las implementaciones centralizadas en src/lib/timezone.ts
// para garantizar que todas las fechas del panel se muestran en
// America/Bogota tanto en local como en Vercel.

export { formatLastSeenInBogota as formatLastSeen } from '@/lib/timezone'
export { formatCreatedAtInBogota as formatCreatedAt } from '@/lib/timezone'
