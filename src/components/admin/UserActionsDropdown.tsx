'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  RefreshCw,
  UserX,
  UserCheck,
  Trash2,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  deactivateUser,
  reactivateUser,
  regenerateSetupToken,
} from '@/actions/users'
import { DeleteUserModal } from './DeleteUserModal'
import { useToastStore } from '@/store/toastStore'
import { getUserStatus, type UserWithStatus } from '@/types/admin'

interface UserActionsDropdownProps {
  user: UserWithStatus
  currentUserId: string
  onTokenRegenerated: (username: string, token: string) => void
}

export function UserActionsDropdown({
  user,
  currentUserId,
  onTokenRegenerated,
}: UserActionsDropdownProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const showToast = useToastStore((s) => s.showToast)
  const status    = getUserStatus(user)
  const isSelf    = user.id === currentUserId

  // Admin no tiene acciones disponibles sobre sí mismo ni sobre otro admin
  if (isSelf || user.is_admin) {
    return (
      <span className="text-text-muted text-sm font-mono px-2">—</span>
    )
  }

  function run(fn: () => Promise<void>) {
    setActionError(null)
    startTransition(async () => {
      await fn()
    })
  }

  async function handleDeactivate() {
    const result = await deactivateUser(user.id)
    if (!result.success) {
      setActionError(result.error)
      showToast('error', result.error)
      return
    }
    showToast('success', `@${user.username} desactivado`)
    router.refresh()
  }

  async function handleReactivate() {
    const result = await reactivateUser(user.id)
    if (!result.success) {
      setActionError(result.error)
      showToast('error', result.error)
      return
    }
    showToast('success', `@${user.username} reactivado`)
    router.refresh()
  }

  async function handleRegenerate() {
    const result = await regenerateSetupToken(user.id)
    if (!result.success) {
      setActionError(result.error)
      showToast('error', result.error)
      return
    }
    onTokenRegenerated(result.username, result.setup_token)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {/* Error inline (fallback visual por si el toast falla) */}
        {actionError && (
          <span className="text-signal-red text-xs font-mono truncate max-w-[160px]">
            {actionError}
          </span>
        )}

        {isPending ? (
          <Loader2 size={15} className="animate-spin text-text-muted" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="xc-btn-ghost h-7 w-7 p-0 flex items-center justify-center"
                aria-label="Acciones del usuario"
              >
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-52 bg-raised border-border shadow-elevation-2 font-mono"
            >
              {/* Regenerar código — solo usuarios pendientes */}
              {status === 'pending' && (
                <>
                  <DropdownMenuItem
                    onClick={() => run(handleRegenerate)}
                    className="flex items-center gap-2.5 text-sm text-text-secondary hover:text-text cursor-pointer focus:bg-overlay focus:text-text"
                  >
                    <RefreshCw size={14} />
                    Regenerar código
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-subtle" />
                </>
              )}

              {/* Desactivar — usuarios activos o pendientes */}
              {(status === 'active' || status === 'pending') && (
                <DropdownMenuItem
                  onClick={() => run(handleDeactivate)}
                  className="flex items-center gap-2.5 text-sm text-signal-red hover:text-signal-red cursor-pointer focus:bg-signal-red/8 focus:text-signal-red"
                >
                  <UserX size={14} />
                  Desactivar cuenta
                </DropdownMenuItem>
              )}

              {/* Reactivar — usuarios desactivados */}
              {status === 'inactive' && (
                <DropdownMenuItem
                  onClick={() => run(handleReactivate)}
                  className="flex items-center gap-2.5 text-sm text-signal-green hover:text-signal-green cursor-pointer focus:bg-signal-green/8 focus:text-signal-green"
                >
                  <UserCheck size={14} />
                  Reactivar cuenta
                </DropdownMenuItem>
              )}

              {/* ── Separador + Eliminar (siempre visible) ──── */}
              <DropdownMenuSeparator className="bg-border-subtle" />

              <DropdownMenuItem
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2.5 text-sm text-signal-red hover:text-signal-red cursor-pointer focus:bg-signal-red/8 focus:text-signal-red"
              >
                <Trash2 size={14} />
                Eliminar usuario
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Modal de confirmación de borrado */}
      {showDeleteModal && (
        <DeleteUserModal
          user={user}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => router.refresh()}
        />
      )}
    </>
  )
}
