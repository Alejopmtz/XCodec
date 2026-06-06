import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, defaultSession, type SessionData } from '@/lib/session'

/**
 * GET /api/session
 *
 * Expone los datos de sesión (sin info sensible) para que los
 * componentes cliente puedan leer el estado de autenticación.
 *
 * Solo devuelve campos seguros: nunca password_hash ni setup_token.
 * El useAuth hook consume este endpoint.
 */
export async function GET() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json(defaultSession, { status: 200 })
  }

  const safeSession: SessionData = {
    isLoggedIn: session.isLoggedIn,
    userId: session.userId,
    username: session.username,
    displayName: session.displayName,
    isAdmin: session.isAdmin,
  }

  return NextResponse.json(safeSession, { status: 200 })
}
