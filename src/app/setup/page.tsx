import type { Metadata } from 'next'
import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import { SetupPasswordForm } from '@/components/auth/SetupPasswordForm'

export const metadata: Metadata = {
  title: 'Activar Cuenta — XCodec',
  description: 'Primer acceso: crea tu contraseña',
}

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-base xc-bg-grid flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] animate-fade-in">

        {/* ── Card ──────────────────────────────────────────── */}
        <div className="xc-card p-10 space-y-8">

          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {/* Icono */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal-green/10 border border-signal-green/20">
                <KeyRound size={18} className="text-signal-green" />
              </div>

              {/* Título */}
              <div>
                <h1 className="font-mono font-semibold text-lg text-text tracking-[0.06em]">
                  PRIMER ACCESO
                </h1>
                <p className="mt-0.5 text-xs text-text-secondary font-mono leading-relaxed">
                  Activa tu cuenta estableciendo una contraseña personal.
                </p>
              </div>
            </div>

            <div className="h-px bg-border-subtle" />
          </div>

          {/* Formulario */}
          <SetupPasswordForm />
        </div>

        {/* ── Footer ────────────────────────────────────────── */}
        <p className="mt-5 text-center text-xs text-text-muted font-mono">
          ¿Ya tienes contraseña?{' '}
          <Link
            href="/login"
            className="text-signal-blue hover:text-text underline underline-offset-2 transition-colors duration-150"
          >
            Iniciar sesión
          </Link>
        </p>

      </div>
    </main>
  )
}
