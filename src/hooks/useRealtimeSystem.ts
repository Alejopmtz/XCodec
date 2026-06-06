'use client'

import { useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'

/**
 * Escucha eventos de sistema emitidos por el servidor vía
 * Supabase Realtime postgres_changes sobre la tabla system_events.
 *
 * Evento: UPDATE en system_events WHERE key = 'chat_cleared'
 *
 *   La Server Action clearAllMessages() invoca la RPC
 *   clear_all_messages(), que ejecuta en una única transacción:
 *     1. DELETE FROM messages
 *     2. UPDATE system_events SET updated_at = now() WHERE key = 'chat_cleared'
 *
 *   Al confirmar la transacción, PostgreSQL emite el cambio
 *   en system_events vía WAL. Supabase Realtime lo entrega aquí
 *   como postgres_changes UPDATE. Entonces vaciamos el store local.
 *
 * Consistencia:
 *   La señal la emite PostgreSQL, no el navegador del admin.
 *   Si la transacción confirmó (RPC sin error), este evento
 *   SIEMPRE llega — salvo fallo de red entre Supabase Realtime
 *   y este cliente, inherente a cualquier sistema distribuido.
 */
export function useRealtimeSystem() {
  const reset = useChatStore((s) => s.reset)

  useEffect(() => {
    const supabase = createSupabaseBrowser()

    const channel = supabase
      .channel('xc-system')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'system_events' },
        () => { reset() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [reset])
}
