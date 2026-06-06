'use client'

import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import type { OnlineUser, PresencePayload } from '@/types/chat'

interface UseOnlineUsersOptions {
  userId: string
  username: string
  displayName: string
}

export function useOnlineUsers({ userId, username, displayName }: UseOnlineUsersOptions) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowser()

    const channel = supabase.channel('xc-presence', {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresencePayload>()
        const users: OnlineUser[] = Object.values(state)
          .flat()
          .map((p) => ({
            userId:      p.userId,
            username:    p.username,
            displayName: p.displayName,
          }))
          // Deduplicar por userId (puede haber múltiples pestañas)
          .filter((u, i, arr) => arr.findIndex((x) => x.userId === u.userId) === i)
          // Admin primero, luego alfabético
          .sort((a, b) => a.username.localeCompare(b.username))

        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, username, displayName } satisfies PresencePayload)
        }
      })

    channelRef.current = channel

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [userId, username, displayName])

  return { onlineUsers }
}
