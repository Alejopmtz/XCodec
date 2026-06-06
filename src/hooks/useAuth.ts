'use client'

import { useState, useEffect, useCallback } from 'react'
import { defaultSession, type SessionData } from '@/lib/session'

type UseAuthReturn = {
  session: SessionData
  user: SessionData | null   // null si no está logueado
  isLoading: boolean
  isAdmin: boolean
  refresh: () => void         // forzar re-lectura de la sesión
}

/**
 * Hook para leer el estado de autenticación en componentes cliente.
 *
 * La sesión está en una cookie HttpOnly — JavaScript no puede leerla
 * directamente. Este hook la obtiene vía /api/session (Server Route).
 *
 * Uso:
 *   const { user, isAdmin, isLoading } = useAuth()
 *   if (isLoading) return <Spinner />
 *   if (!user) return null // middleware ya redirigió, esto no ocurre
 */
export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<SessionData>(defaultSession)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSession = useCallback(() => {
    setIsLoading(true)
    fetch('/api/session')
      .then((res) => {
        if (!res.ok) throw new Error('Session fetch failed')
        return res.json() as Promise<SessionData>
      })
      .then((data) => {
        setSession(data)
      })
      .catch(() => {
        setSession(defaultSession)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  return {
    session,
    user: session.isLoggedIn ? session : null,
    isLoading,
    isAdmin: session.isAdmin,
    refresh: fetchSession,
  }
}
