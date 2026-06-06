import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'
import { createSupabaseServer } from '@/lib/supabase/server'

// POST /api/heartbeat
//
// Dos responsabilidades:
//   1. Actualizar last_seen del usuario autenticado (presencia en chat).
//   2. Detectar si el usuario fue desactivado por el admin mientras
//      tenía una sesión activa y destruir la sesión en ese caso.
//
// El cliente (ChatShell) llama a este endpoint cada 30 s.
// Si recibe un 401, navega a /login inmediatamente.
export async function POST() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const supabase = createSupabaseServer()

  // Verificar que el usuario sigue activo en la base de datos.
  // Esto detecta desactivaciones en tiempo real: si el admin desactiva
  // un usuario, en el siguiente heartbeat (máx. 30s) se destruye la sesión.
  const { data: user } = await supabase
    .from('users')
    .select('is_active')
    .eq('id', session.userId)
    .returns<{ is_active: boolean }[]>()
    .maybeSingle()

  if (!user?.is_active) {
    // Usuario no encontrado o desactivado — invalida la sesión de inmediato.
    // El cliente recibirá 401 y redirigirá a /login.
    session.destroy()
    return NextResponse.json({ ok: false, reason: 'session_invalid' }, { status: 401 })
  }

  // Actualizar timestamp de presencia
  await supabase.rpc('update_last_seen', { p_user_id: session.userId })
  return NextResponse.json({ ok: true })
}
