'use client'

import { useEffect } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'

// Auto-dismiss tras DURATION ms.
// Se re-arma el timer cada vez que cambia el toast,
// lo que permite mostrar varios toasts consecutivos correctamente.
const DURATION = 4_000

export function ToastContainer() {
  const toast     = useToastStore((s) => s.toast)
  const hideToast = useToastStore((s) => s.hideToast)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(hideToast, DURATION)
    return () => clearTimeout(timer)
  }, [toast, hideToast])

  if (!toast) return null

  const isSuccess = toast.type === 'success'

  return (
    <div className="fixed bottom-5 right-5 z-[100] animate-fade-in pointer-events-auto">
      <div
        role="status"
        aria-live="polite"
        className={[
          'flex items-center gap-3 rounded-lg border px-4 py-3',
          'bg-raised shadow-elevation-2 min-w-[240px] max-w-[360px]',
          isSuccess
            ? 'border-signal-green/25'
            : 'border-signal-red/25',
        ].join(' ')}
      >
        {/* Icono semántico */}
        {isSuccess
          ? <CheckCircle2 size={15} className="shrink-0 text-signal-green" />
          : <XCircle     size={15} className="shrink-0 text-signal-red" />
        }

        {/* Mensaje */}
        <span className="flex-1 font-mono text-xs text-text leading-relaxed">
          {toast.message}
        </span>

        {/* Cierre manual */}
        <button
          onClick={hideToast}
          aria-label="Cerrar notificación"
          className="shrink-0 text-text-muted hover:text-text transition-colors duration-150"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
