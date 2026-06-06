import { UserStatusBadge } from './UserStatusBadge'
import { UserActionsDropdown } from './UserActionsDropdown'
import { formatLastSeen, formatCreatedAt, type UserWithStatus } from '@/types/admin'
import { getInitials, getUserColor } from '@/lib/utils'

interface UserRowProps {
  user: UserWithStatus
  currentUserId: string
  onTokenRegenerated: (username: string, token: string) => void
}

export function UserRow({
  user,
  currentUserId,
  onTokenRegenerated,
}: UserRowProps) {
  const initials = getInitials(user.display_name)
  const avatarColor = getUserColor(user.id)
  const isSelf = user.id === currentUserId

  return (
    <tr className="group border-b border-border-subtle last:border-0 hover:bg-raised/50 transition-colors duration-100">

      {/* ── Usuario ─────────────────────────────────────── */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar con iniciales */}
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-mono font-semibold text-base select-none"
            style={{ backgroundColor: avatarColor + '28', color: avatarColor, border: `1px solid ${avatarColor}30` }}
          >
            {initials}
          </span>

          <div className="min-w-0">
            <span className="block font-mono text-sm text-text truncate">
              {user.username}
            </span>
            {user.is_admin && (
              <span className="text-2xs text-signal-gold font-mono">
                administrador
              </span>
            )}
            {isSelf && !user.is_admin && (
              <span className="text-2xs text-text-muted font-mono">
                (tú)
              </span>
            )}
          </div>
        </div>
      </td>

      {/* ── Nombre ──────────────────────────────────────── */}
      <td className="px-4 py-3">
        <span className="font-mono text-sm text-text-secondary truncate block max-w-[180px]">
          {user.display_name}
        </span>
      </td>

      {/* ── Estado ──────────────────────────────────────── */}
      <td className="px-4 py-3">
        <UserStatusBadge user={user} />
      </td>

      {/* ── Última conexión ─────────────────────────────── */}
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-text-muted tabular-nums">
          {formatLastSeen(user.last_seen)}
        </span>
      </td>

      {/* ── Fecha de creación ───────────────────────────── */}
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-text-muted tabular-nums">
          {formatCreatedAt(user.created_at)}
        </span>
      </td>

      {/* ── Acciones ────────────────────────────────────── */}
      <td className="px-4 py-3 text-right">
        <UserActionsDropdown
          user={user}
          currentUserId={currentUserId}
          onTokenRegenerated={onTokenRegenerated}
        />
      </td>

    </tr>
  )
}
