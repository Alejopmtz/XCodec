'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2 } from 'lucide-react'
import { createUser } from '@/actions/users'

interface CreateUserFormProps {
  onCreated: (username: string, token: string) => void
  onCancel: () => void
}

export function CreateUserForm({ onCreated, onCancel }: CreateUserFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const rawData = {
      display_name: formData.get('display_name') as string,
      username: formData.get('username') as string,
    }

    setErrors({})
    setGlobalError(null)

    startTransition(async () => {
      const result = await createUser(rawData)

      if (!result.success) {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors)
        } else {
          setGlobalError(result.error ?? 'Error al crear usuario')
        }
        return
      }

      // Refrescar el Server Component para que la tabla muestre el nuevo usuario
      router.refresh()
      onCreated(result.username, result.setup_token)
    })
  }

  return (
    <div className="xc-card p-6">

      {/* ── Encabezado ──────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 mb-6">
        <UserPlus size={16} className="text-signal-green" />
        <h2 className="font-mono font-semibold text-sm tracking-wide text-text">
          NUEVO USUARIO
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        {/* Error global */}
        {globalError && (
          <p className="font-mono text-xs text-signal-red bg-signal-red/8 border border-signal-red/20 rounded px-3 py-2">
            {globalError}
          </p>
        )}

        {/* ── Nombre para mostrar ─────────────────────────── */}
        <div className="space-y-1.5">
          <label htmlFor="display_name" className="xc-label">
            Nombre visible
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            autoComplete="off"
            disabled={isPending}
            placeholder="Ej: Alice Johnson"
            className={`xc-input ${errors.display_name ? 'border-signal-red focus:border-signal-red focus:ring-signal-red/20' : ''}`}
          />
          {errors.display_name && (
            <p className="font-mono text-xs text-signal-red">{errors.display_name}</p>
          )}
        </div>

        {/* ── Nombre de usuario ───────────────────────────── */}
        <div className="space-y-1.5">
          <label htmlFor="username" className="xc-label">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted select-none pointer-events-none">
              @
            </span>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="off"
              disabled={isPending}
              placeholder="alice_j"
              className={`xc-input pl-7 ${errors.username ? 'border-signal-red focus:border-signal-red focus:ring-signal-red/20' : ''}`}
            />
          </div>
          {errors.username ? (
            <p className="font-mono text-xs text-signal-red">{errors.username}</p>
          ) : (
            <p className="font-mono text-xs text-text-muted">
              2-30 caracteres, solo letras, números y guiones bajos
            </p>
          )}
        </div>

        {/* ── Acciones ────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="xc-btn-secondary text-sm px-4 py-2"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="xc-btn-primary text-sm px-5 py-2 flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Creando…
              </>
            ) : (
              <>
                <UserPlus size={14} />
                Crear usuario
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
