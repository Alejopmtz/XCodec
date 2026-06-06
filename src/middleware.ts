import { type NextRequest, NextResponse } from 'next/server'
import { unsealData } from 'iron-session'
import type { SessionData } from '@/lib/session'

/**
 * Middleware de protección de rutas — XCodec
 *
 * Usa unsealData (solo lectura) en lugar de getIronSession para
 * evitar escribir cookies en cada request, lo cual es innecesario
 * en middleware donde solo necesitamos verificar la sesión.
 *
 * Lógica de rutas:
 *   Sin sesión          → /login (excepto rutas públicas)
 *   Sesión + /login     → /chat  (ya está autenticado)
 *   Sesión + /setup     → /chat  (ya está autenticado)
 *   Sesión + /admin     → /chat  (si no es admin)
 *   /                   → /chat o /login según sesión
 */

// Rutas que no requieren autenticación
const PUBLIC_PATHS = ['/login', '/setup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Resolver la sesión actual ──────────────────────────────
  const cookieValue = request.cookies.get('xc_session')?.value
  let session: SessionData | null = null

  if (cookieValue) {
    try {
      session = await unsealData<SessionData>(cookieValue, {
        password: process.env.SESSION_SECRET!,
      })
      // Verificar que el objeto desencriptado es una sesión válida
      if (!session?.isLoggedIn) session = null
    } catch {
      // Cookie corrupta o manipulada — tratar como sin sesión
      session = null
    }
  }

  const isLoggedIn = session !== null
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // ── Redirigir raíz ────────────────────────────────────────
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(isLoggedIn ? '/chat' : '/login', request.url)
    )
  }

  // ── Sin sesión → solo rutas públicas ─────────────────────
  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    // Preservar la URL de destino para redirigir después del login
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Con sesión → no puede volver a login/setup ───────────
  if (isLoggedIn && isPublicPath) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  // ── /admin solo para administradores ─────────────────────
  if (isLoggedIn && pathname.startsWith('/admin') && !session?.isAdmin) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Excluir assets estáticos, imágenes y favicon del middleware
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
