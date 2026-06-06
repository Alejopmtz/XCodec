'use client'

import { useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'
import type { MessageWithSender } from '@/types/chat'

// Suscripción a INSERT/UPDATE en messages via Supabase Realtime.
// Cuando llega un nuevo mensaje, enriquece con datos del sender y
// lo añade al store. En UPDATE detecta soft delete y marca en store.
export function useRealtimeMessages() {
  const appendMessage = useChatStore((s) => s.appendMessage)
  const markDeleted   = useChatStore((s) => s.markDeleted)
  const channelRef    = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowser()

    const channel = supabase
      .channel('xc-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const raw = payload.new as {
            id: string
            content: string
            sender_id: string
            is_deleted: boolean
            created_at: string
          }

          // Enriquecer con datos del sender.
          // .returns<>() anula la inferencia de template literal types de Supabase
          // que puede producir `data: never` en TypeScript strict mode al parsear
          // strings de columnas parciales.
          const { data: sender } = await supabase
            .from('users')
            .select('username, display_name')
            .eq('id', raw.sender_id)
            .returns<{ username: string; display_name: string }[]>()
            .maybeSingle()

          const msg: MessageWithSender = {
            id:                  raw.id,
            content:             raw.content,
            sender_id:           raw.sender_id,
            is_deleted:          raw.is_deleted,
            created_at:          raw.created_at,
            sender_username:     sender?.username     ?? 'desconocido',
            sender_display_name: sender?.display_name ?? 'Desconocido',
          }

          appendMessage(msg)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updated = payload.new as { id: string; is_deleted: boolean }
          if (updated.is_deleted) markDeleted(updated.id)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [appendMessage, markDeleted])
}
