'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { signIn } from '@/actions/auth'
import type { LoginInput } from '@/lib/validations/auth'

// Acepta solo rutas relativas internas: empieza por '/' pero NO por '//'
// Rechaza protocol-relative URLs (//evil.com) que algunos navegadores
// interpretan como http://evil.com, permitiendo open redirect.
function sanitizeNextUrl(raw: string | null): string {
  if (raw && /^\/(?!\/)/.test(raw)) return raw
  return '/chat'
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [fields, setFields] = useState<LoginInput>({
    username: '',
    password: '',
  })

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
            error
              ? 'border-signal-red focus:border-signal-red focus:shadow-glow-red'
              : '',
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
              error
                ? 'border-signal-red focus:border-signal-red focus:shadow-glow-red'
                : '',
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

      {/* ── Submit ───────────────────────────────────────── */}
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
    </form>
  )
}
