'use client'

import { useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'

/**
 * Escucha eventos de borrado total del historial emitidos por PostgreSQL
 * vía Supabase Realtime postgres_changes sobre la tabla messages.
 *
 * Evento: DELETE en messages
 *
 *   La Server Action clearAllMessages() ejecuta:
 *     DELETE FROM messages WHERE id IS NOT NULL
 *
 *   Cada fila eliminada genera un evento postgres_changes { event: 'DELETE' }.
 *   La tabla messages está publicada en supabase_realtime (migración 002).
 *
 * Debounce:
 *   Un borrado total genera múltiples eventos DELETE (uno por fila).
 *   El debounce de 150 ms colapsa todos en una única llamada a reset(),
 *   evitando renders innecesarios mientras los eventos llegan.
 *
 * Sin dependencia de migration 006:
 *   Esta implementación no requiere la tabla system_events ni la RPC
 *   clear_all_messages(). Solo depende de la tabla messages y de la
 *   publicación en supabase_realtime (migración 002, siempre aplicada).
 */
export function useRealtimeSystem() {
  const reset = useChatStore((s) => s.reset)

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const channel = supabase
      .channel('xc-system')
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => reset(), 150)
        }
      )
      .subscribe()

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      supabase.removeChannel(channel)
    }
  }, [reset])
}
