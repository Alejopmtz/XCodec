'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Eye, EyeOff, LogIn, Loader2,
  KeyRound, ArrowLeft,
} from 'lucide-react'
import { signIn } from '@/actions/auth'
import { SetupPasswordForm } from './SetupPasswordForm'
import type { LoginInput } from '@/lib/validations/auth'

type Mode = 'login' | 'setup'

// Acepta solo rutas relativas internas: empieza por '/' pero NO por '//'
// Rechaza protocol-relative URLs (//evil.com) que algunos navegadores
// interpretan como http://evil.com, permitiendo open redirect.
function sanitizeNextUrl(raw: string | null): string {
  if (raw && /^\/(?!\/)/.test(raw)) return raw
  return '/chat'
}

// ── Modo activación de cuenta ─────────────────────────────────
function SetupMode({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-5">

      {/* Cabecera del modo setup */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center h-7 w-7 rounded text-text-muted hover:text-text hover:bg-raised transition-colors duration-150"
            aria-label="Volver al inicio de sesión"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="flex items-center gap-2">
            <KeyRound
              size={14}
              className="text-signal-green shrink-0"
              style={{ filter: 'drop-shadow(0 0 5px rgba(63,185,80,0.4))' }}
            />
            <span className="font-mono font-semibold text-sm text-text tracking-[0.06em]">
              PRIMER ACCESO
            </span>
          </div>
        </div>

        <p className="text-xs text-text-secondary font-mono leading-relaxed pl-10">
          Activa tu cuenta con el código que te proporcionó el administrador.
        </p>

        <div className="h-px bg-border-subtle" />
      </div>

      {/* Formulario de activación */}
      <SetupPasswordForm />

    </div>
  )
}

// ── Modo inicio de sesión ─────────────────────────────────────
export function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode]       = useState<Mode>('login')
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [shake,  setShake]  = useState(false)
  const [fields, setFields] = useState<LoginInput>({ username: '', password: '' })

  // Si el usuario está en modo setup, renderizar esa vista
  if (mode === 'setup') {
    return <SetupMode onBack={() => setMode('login')} />
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending) return
    setError(null)

    startTransition(async () => {
      const result = await signIn(fields)

      if (!result.success) {
        setError(result.error)
        triggerShake()
        return
      }

      // sanitizeNextUrl garantiza que el redirect es siempre interno
      const next = sanitizeNextUrl(searchParams.get('next'))
      router.replace(next)
    })
  }

  const isDisabled = isPending || !fields.username.trim() || !fields.password

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-5 ${shake ? 'animate-shake' : ''}`}
      noValidate
    >
      {/* ── Username ─────────────────────────────────────── */}
      <div>
        <label htmlFor="username" className="xc-label">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoFocus
          required
          disabled={isPending}
          value={fields.username}
          onChange={handleChange}
          placeholder="tu_usuario"
          className={[
            'xc-input',
            error ? 'border-signal-red focus:border-signal-red focus:shadow-glow-red' : '',
          ].join(' ')}
          aria-invalid={!!error}
          aria-describedby={error ? 'auth-error' : undefined}
        />
      </div>

      {/* ── Password ─────────────────────────────────────── */}
      <div>
        <label htmlFor="password" className="xc-label">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            disabled={isPending}
            value={fields.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={[
              'xc-input pr-11',
              error ? 'border-signal-red focus:border-signal-red focus:shadow-glow-red' : '',
            ].join(' ')}
            aria-invalid={!!error}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            disabled={isPending}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-secondary transition-colors duration-150"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────── */}
      {error && (
        <div
          id="auth-error"
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2 rounded-md border border-signal-red/20 bg-signal-red/5 px-3 py-2.5 animate-fade-in"
        >
          <span className="mt-px shrink-0 text-signal-red text-sm">✗</span>
          <span className="text-signal-red text-sm font-mono">{error}</span>
        </div>
      )}

      {/* ── Iniciar sesión ───────────────────────────────── */}
      <button
        type="submit"
        disabled={isDisabled}
        className="xc-btn-primary w-full mt-2"
      >
        {isPending ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Autenticando...
          </>
        ) : (
          <>
            <LogIn size={15} />
            Iniciar Sesión
          </>
        )}
      </button>

      {/* ── Separador ────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="text-2xs text-text-muted font-mono tracking-[0.12em]">o</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      {/* ── Primer ingreso ───────────────────────────────── */}
      <button
        type="button"
        onClick={() => setMode('setup')}
        className="xc-btn-ghost w-full flex items-center justify-center gap-2 text-xs text-text-secondary"
      >
        <KeyRound size={13} className="text-signal-green" />
        Primer ingreso
      </button>

    </form>
  )
}
