'use client'

import { useCallback } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'
import type { MessageWithSender } from '@/types/chat'

const PAGE_SIZE = 50

// Carga mensajes más antiguos que el cursor actual (paginación hacia arriba).
// La carga inicial se hace desde el Server Component y se inyecta en el store
// al montar ChatShell; este hook solo gestiona el "cargar más".
//
// Selectores granulares en lugar de useChatStore() completo: cada selector
// suscribe el hook únicamente al slice de estado que le importa. Sin esto,
// appendMessage (cada mensaje nuevo) forzaba un re-render de este hook y
// recreación de loadMore aunque sus dependencias no hubieran cambiado.
export function useMessages() {
  const oldestCursor    = useChatStore((s) => s.oldestCursor)
  const isLoadingMore   = useChatStore((s) => s.isLoadingMore)
  const hasMore         = useChatStore((s) => s.hasMore)
  const prependMessages = useChatStore((s) => s.prependMessages)
  const setHasMore      = useChatStore((s) => s.setHasMore)
  const setOldestCursor = useChatStore((s) => s.setOldestCursor)
  const setIsLoadingMore = useChatStore((s) => s.setIsLoadingMore)

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !oldestCursor) return

    setIsLoadingMore(true)
    try {
      const supabase = createSupabaseBrowser()
      const { data, error } = await supabase.rpc('get_messages_page', {
        p_cursor: oldestCursor,
        p_limit: PAGE_SIZE,
      })

      if (error || !data) return

      const msgs = data as MessageWithSender[]
      if (msgs.length === 0) {
        setHasMore(false)
        return
      }

      // La función devuelve mensajes en orden DESC; los invertimos para mostrar
      // cronológicamente (más antiguo primero dentro del bloque cargado).
      const sorted = [...msgs].reverse()
      prependMessages(sorted)
      setHasMore(msgs.length === PAGE_SIZE)

      // Cursor = created_at del mensaje más antiguo recién cargado
      const oldest = sorted[0]
      if (oldest) setOldestCursor(oldest.created_at)
    } finally {
      setIsLoadingMore(false)
    }
  }, [
    isLoadingMore,
    hasMore,
    oldestCursor,
    prependMessages,
    setHasMore,
    setOldestCursor,
    setIsLoadingMore,
  ])

  return { loadMore, isLoadingMore, hasMore }
}
