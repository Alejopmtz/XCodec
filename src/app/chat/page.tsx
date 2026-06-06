import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'
import { createSupabaseServer } from '@/lib/supabase/server'
import { ChatShell } from '@/components/chat/ChatShell'
import type { MessageWithSender } from '@/types/chat'

export const metadata = { title: 'Chat · XCodec' }

// Deshabilitar caché — el chat siempre necesita datos frescos
export const dynamic = 'force-dynamic'

const INITIAL_LIMIT = 50

export default async function ChatPage() {
  /* ── Verificar sesión ──────────────────────────────────── */
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) redirect('/login')

  /* ── Cargar mensajes iniciales (SSR) ───────────────────── */
  const supabase = createSupabaseServer()
  const { data, error } = await supabase.rpc('get_messages_page', {
    p_cursor: null,
    p_limit: INITIAL_LIMIT,
  })

  const initialMessages: MessageWithSender[] = error ? [] : (data ?? [])

  return (
    <ChatShell
      initialMessages={initialMessages}
      currentUserId={session.userId}
      currentUsername={session.username}
      currentDisplayName={session.displayName}
      isAdmin={session.isAdmin}
    />
  )
}
