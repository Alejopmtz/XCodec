import type { SessionOptions } from 'iron-session'

// ── Tipo de sesión ────────────────────────────────────────────
// Datos almacenados en la cookie cifrada.
// No contiene información sensible (no hay password_hash aquí).
// isLoggedIn=true significa: autenticado Y cuenta activa.

export type SessionData = {
  isLoggedIn: boolean
  userId: string
  username: string
  displayName: string
  isAdmin: boolean
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
  userId: '',
  username: '',
  displayName: '',
  isAdmin: false,
}

// ── Configuración de iron-session ─────────────────────────────
// La cookie se cifra con AES-256-CBC usando SESSION_SECRET.
// HttpOnly → JavaScript del cliente no puede leerla.
// SameSite strict → protección CSRF básica.
//
// SESSION_SECRET debe estar definido en TODOS los entornos
// (desarrollo, CI, producción). Ver .env.example para generarlo.
//
// No se valida a nivel de módulo para no bloquear `next build`
// en entornos CI que no inyectan variables de entorno en el paso
// de build. Iron-session lanzará un error descriptivo en el
// primer request si la variable está ausente o es demasiado corta.

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'xc_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    // 7 días en segundos
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  },
}
