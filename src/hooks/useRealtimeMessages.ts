'use client'

import { useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'
import type { MessageWithSender } from '@/types/chat'

// Suscripción a INSERT en la tabla messages via Supabase Realtime.
// Cuando llega un nuevo mensaje, enriquece con datos del sender y
// lo añade al store.
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

          // Enriquecer con info del sender
          const { data: sender } = await supabase
            .from('users')
            .select('username, display_name')
            .eq('id', raw.sender_id)
            .single()

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
