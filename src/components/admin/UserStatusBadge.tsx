import { getUserStatus, type UserWithStatus } from '@/types/admin'

interface UserStatusBadgeProps {
  user: Pick<UserWithStatus, 'is_active' | 'password_set'>
}

const STATUS_CONFIG = {
  active: {
    dot: 'bg-signal-green shadow-[0_0_6px_rgba(63,185,80,0.6)]',
    text: 'text-signal-green',
    bg: 'bg-signal-green/8 border-signal-green/20',
    label: 'Activo',
  },
  pending: {
    dot: 'bg-signal-amber',
    text: 'text-signal-amber',
    bg: 'bg-signal-amber/8 border-signal-amber/20',
    label: 'Pendiente',
  },
  inactive: {
    dot: 'bg-text-muted',
    text: 'text-text-muted',
    bg: 'bg-active border-border-subtle',
    label: 'Desactivado',
  },
} as const

export function UserStatusBadge({ user }: UserStatusBadgeProps) {
  const status = getUserStatus(user)
  const cfg = STATUS_CONFIG[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 border font-mono font-medium text-2xs uppercase tracking-[0.08em] ${cfg.bg} ${cfg.text}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
