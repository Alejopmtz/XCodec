'use client'

import { useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'

/**
 * Escucha eventos de sistema emitidos por el admin vía Supabase Realtime
 * Broadcast en el canal 'xc-system'.
 *
 * Evento 'chat_cleared':
 *   El admin ha borrado todos los mensajes. Vaciamos el store local
 *   inmediatamente para que el usuario vea el chat vacío en tiempo real.
 */
export function useRealtimeSystem() {
  const reset = useChatStore((s) => s.reset)

  useEffect(() => {
    const supabase = createSupabaseBrowser()

    const channel = supabase
      .channel('xc-system')
      .on('broadcast', { event: 'chat_cleared' }, () => {
        reset()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [reset])
}
