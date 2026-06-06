'use client'

import { useState, useTransition, useId } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, KeyRound, Loader2, Check, X } from 'lucide-react'
import { activateAccount } from '@/actions/auth'

// ── Evaluador de fortaleza de contraseña ──────────────────────

type PasswordStrength = {
  score: 0 | 1 | 2 | 3
  label: string
  colorClass: string
  textClass: string
}

function evaluatePassword(password: string): PasswordStrength {
  if (password.length === 0) {
    return { score: 0, label: '', colorClass: 'bg-border', textClass: '' }
  }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 14) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) {
    return {
      score: 1,
      label: 'Débil',
      colorClass: 'bg-signal-red',
      textClass: 'text-signal-red',
    }
  }
  if (score <= 3) {
    return {
      score: 2,
      label: 'Media',
      colorClass: 'bg-signal-amber',
      textClass: 'text-signal-amber',
    }
  }
  return {
    score: 3,
    label: 'Segura',
    colorClass: 'bg-signal-green',
    textClass: 'text-signal-green',
  }
}

// ── Componente principal ──────────────────────────────────────

export function SetupPasswordForm() {
  const router = useRouter()
  const formId = useId()
  const [isPending, startTransition] = useTransition()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fields, setFields] = useState({
    username: '',
    setup_token: '',
    password: '',
    confirm_password: '',
  })

  const strength = evaluatePassword(fields.password)
  const passwordsMatch =
    fields.confirm_password.length > 0 &&
    fields.password === fields.confirm_password
  const passwordsMismatch =
    fields.confirm_password.length > 0 &&
    fields.password !== fields.confirm_password

  const isFormValid =
    fields.username.trim().length >= 2 &&
    fields.setup_token.trim().length >= 1 &&
    fields.password.length >= 8 &&
    passwordsMatch

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending || !isFormValid) return
    setError(null)

    startTransition(async () => {
      const result = await activateAccount(fields)

      if (!result.success) {
        setError(result.error)
        return
      }

      // Cuenta activada + sesión creada → al chat
      router.replace('/chat')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>

      {/* ── Username ───────────────────────────────────────── */}
      <div>
        <label htmlFor={`${formId}-username`} className="xc-label">
          Usuario
        </label>
        <input
          id={`${formId}-username`}
          name="username"
          type="text"
          autoComplete="username"
          autoFocus
          required
          disabled={isPending}
          value={fields.username}
          onChange={handleChange}
          placeholder="tu_usuario"
          className="xc-input"
        />
      </div>

      {/* ── Setup Token ────────────────────────────────────── */}
      <div>
        <label htmlFor={`${formId}-setup_token`} className="xc-label">
          Código de Activación
        </label>
        <input
          id={`${formId}-setup_token`}
          name="setup_token"
          type="text"
          autoComplete="off"
          spellCheck={false}
          required
          disabled={isPending}
          value={fields.setup_token}
          onChange={handleChange}
          placeholder="XXXXXXXX"
          maxLength={20}
          className="xc-input uppercase tracking-[0.25em] font-mono"
        />
        <p className="mt-1.5 text-xs text-text-muted font-mono">
          Proporcionado por el administrador del sistema
        </p>
      </div>

      {/* ── Nueva contraseña ───────────────────────────────── */}
      <div>
        <label htmlFor={`${formId}-password`} className="xc-label">
          Nueva Contraseña
        </label>
        <div className="relative">
          <input
            id={`${formId}-password`}
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            disabled={isPending}
            value={fields.password}
            onChange={handleChange}
            placeholder="Mínimo 8 caracteres"
            className="xc-input pr-11"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            disabled={isPending}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-secondary transition-colors duration-150"
            aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {/* Barra de fortaleza */}
        {fields.password.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            <div className="flex gap-1.5">
              {([1, 2, 3] as const).map((level) => (
                <div
                  key={level}
                  className={[
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    strength.score >= level ? strength.colorClass : 'bg-border',
                  ].join(' ')}
                />
              ))}
            </div>
            <p className={`text-xs font-mono ${strength.textClass}`}>
              {strength.label}
            </p>
          </div>
        )}
      </div>

      {/* ── Confirmar contraseña ───────────────────────────── */}
      <div>
        <label htmlFor={`${formId}-confirm`} className="xc-label">
          Confirmar Contraseña
        </label>
        <div className="relative">
          <input
            id={`${formId}-confirm`}
            name="confirm_password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            required
            disabled={isPending}
            value={fields.confirm_password}
            onChange={handleChange}
            placeholder="Repite la contraseña"
            className={[
              'xc-input pr-11',
              passwordsMismatch
                ? 'border-signal-red/60 focus:border-signal-red focus:shadow-glow-red'
                : '',
              passwordsMatch
                ? 'border-signal-green/40 focus:border-signal-green focus:shadow-glow-green'
                : '',
            ].join(' ')}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirm((v) => !v)}
            disabled={isPending}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-secondary transition-colors duration-150"
            aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
          >
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {/* Indicador de coincidencia */}
        {fields.confirm_password.length > 0 && (
          <p
            className={[
              'mt-1.5 flex items-center gap-1.5 text-xs font-mono transition-colors',
              passwordsMatch ? 'text-signal-green' : 'text-signal-red',
            ].join(' ')}
          >
            {passwordsMatch ? (
              <>
                <Check size={12} strokeWidth={2.5} />
                Las contraseñas coinciden
              </>
            ) : (
              <>
                <X size={12} strokeWidth={2.5} />
                Las contraseñas no coinciden
              </>
            )}
          </p>
        )}
      </div>

      {/* ── Error global ───────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2 rounded-md border border-signal-red/20 bg-signal-red/5 px-3 py-2.5 animate-fade-in"
        >
          <span className="mt-px shrink-0 text-signal-red text-sm">✗</span>
          <span className="text-signal-red text-sm font-mono">{error}</span>
        </div>
      )}

      {/* ── Submit ─────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isPending || !isFormValid}
        className="xc-btn-primary w-full mt-2"
      >
        {isPending ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Activando cuenta...
          </>
        ) : (
          <>
            <KeyRound size={15} />
            Activar Cuenta
          </>
        )}
      </button>
    </form>
  )
}
