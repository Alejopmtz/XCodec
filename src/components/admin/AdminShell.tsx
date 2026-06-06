'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { UserTable } from './UserTable'
import { CreateUserForm } from './CreateUserForm'
import { NewUserModal } from './NewUserModal'
import type { UserWithStatus } from '@/types/admin'

interface AdminShellProps {
  users: UserWithStatus[]
  currentUserId: string
}

type View = 'list' | 'creating'

interface ModalData {
  username: string
  token: string
}

export function AdminShell({ users, currentUserId }: AdminShellProps) {
  const [view, setView] = useState<View>('list')
  const [modal, setModal] = useState<ModalData | null>(null)

  function handleCreated(username: string, token: string) {
    setView('list')
    setModal({ username, token })
  }

  function handleTokenRegenerated(username: string, token: string) {
    setModal({ username, token })
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* ── Barra superior ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono font-semibold text-base text-text tracking-wide">
            Gestión de usuarios
          </h1>
          <p className="font-mono text-xs text-text-muted mt-0.5">
            {users.length} {users.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
          </p>
        </div>

        {view === 'list' && (
          <button
            onClick={() => setView('creating')}
            className="xc-btn-primary text-xs px-4 py-2 flex items-center gap-2"
          >
            <UserPlus size={14} />
            Nuevo usuario
          </button>
        )}
      </div>

      {/* ── Formulario de creación ──────────────────────────── */}
      {view === 'creating' && (
        <div className="max-w-md">
          <CreateUserForm
            onCreated={handleCreated}
            onCancel={() => setView('list')}
          />
        </div>
      )}

      {/* ── Tabla de usuarios ───────────────────────────────── */}
      <UserTable
        users={users}
        currentUserId={currentUserId}
        onTokenRegenerated={handleTokenRegenerated}
      />

      {/* ── Modal de credenciales ───────────────────────────── */}
      {modal && (
        <NewUserModal
          username={modal.username}
          setupToken={modal.token}
          onClose={() => setModal(null)}
        />
      )}

    </div>
  )
}
