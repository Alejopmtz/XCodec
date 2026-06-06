import { UserRow } from './UserRow'
import type { UserWithStatus } from '@/types/admin'

interface UserTableProps {
  users: UserWithStatus[]
  currentUserId: string
  onTokenRegenerated: (username: string, token: string) => void
}

const COLUMNS = [
  { label: 'Usuario',     width: 'w-[200px]' },
  { label: 'Nombre',      width: 'w-[180px]' },
  { label: 'Estado',      width: 'w-[130px]' },
  { label: 'Última vez',  width: 'w-[110px]' },
  { label: 'Creado',      width: 'w-[100px]' },
  { label: '',            width: 'w-[80px]'  },
]

export function UserTable({
  users,
  currentUserId,
  onTokenRegenerated,
}: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[760px] border-collapse">

        {/* ── Encabezado ──────────────────────────────────── */}
        <thead>
          <tr className="border-b border-border bg-raised">
            {COLUMNS.map((col, i) => (
              <th
                key={i}
                className={`${col.width} px-4 py-2.5 text-left font-mono font-medium text-2xs text-text-muted uppercase tracking-[0.1em]`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Filas ───────────────────────────────────────── */}
        <tbody className="bg-surface">
          {users.length === 0 ? (
            <tr>
              <td
                colSpan={COLUMNS.length}
                className="px-4 py-12 text-center font-mono text-sm text-text-muted"
              >
                No hay usuarios registrados
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                onTokenRegenerated={onTokenRegenerated}
              />
            ))
          )}
        </tbody>

      </table>
    </div>
  )
}
