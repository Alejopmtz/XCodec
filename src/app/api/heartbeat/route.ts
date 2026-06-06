import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'
import { createSupabaseServer } from '@/lib/supabase/server'

// POST /api/heartbeat — actualiza last_seen del usuario autenticado.
// Llamado cada 30 s desde ChatShell.
export async function POST() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const supabase = createSupabaseServer()
  await supabase.rpc('update_last_seen', { p_user_id: session.userId })

  return NextResponse.json({ ok: true })
}
