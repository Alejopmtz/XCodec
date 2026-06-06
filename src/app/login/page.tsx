import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ShieldCheck } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Acceso — XCodec',
  description: 'Sistema privado de mensajería',
  // Página privada — no indexar en buscadores
  robots: { index: false, follow: false },
}

// LoginForm usa useSearchParams internamente → necesita Suspense
// https://nextjs.org/docs/app/api-reference/functions/use-search-params
function LoginFormWrapper() {
  return (
    <Suspense fallback={<div className="h-[180px] animate-pulse" />}>
      <LoginForm />
    </Suspense>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-base xc-bg-grid flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] animate-fade-in">

        {/* ── Card ──────────────────────────────────────────── */}
        <div className="xc-card p-10 space-y-8">

          {/* Logo */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <ShieldCheck
                size={26}
                className="text-signal-green shrink-0"
                style={{ filter: 'drop-shadow(0 0 8px rgba(63,185,80,0.45))' }}
              />
              <span
                className="font-sans font-bold text-[22px] tracking-[0.14em] text-text"
                style={{ textShadow: '0 0 18px rgba(63,185,80,0.25)' }}
              >
                XCODEC
              </span>
            </div>

            {/* Divisor con label */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border-subtle" />
              <span className="text-2xs text-text-muted font-mono uppercase tracking-[0.18em]">
                acceso privado
              </span>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>
          </div>

          {/* Formulario */}
          <LoginFormWrapper />
        </div>

        {/* ── Footer ────────────────────────────────────────── */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-border-subtle" />
          <p className="text-2xs text-text-muted font-mono tracking-[0.12em]">
            Sistema privado · Acceso restringido
          </p>
          <div className="h-px w-8 bg-border-subtle" />
        </div>

      </div>
    </main>
  )
}
