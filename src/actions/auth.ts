'use server'

import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { redirect } from 'next/navigation'

import { sessionOptions, type SessionData } from '@/lib/session'
import { loginSchema, setupPasswordSchema } from '@/lib/validations/auth'
import { validateAdminPassword } from '@/lib/auth/admin-password'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { DbUser } from '@/types/database.types'

export type AuthActionResult =
  | { success: false; error: string }
  | { success: true }

async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

// ══════════════════════════════════════════════════════════════
// signIn
// ══════════════════════════════════════════════════════════════

export async function signIn(rawData: unknown): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? 'Datos de entrada inválidos',
    }
  }
  const { username, password } = parsed.data

  const supabase = createSupabaseServer()

  // select('*') garantiza que TypeScript infiere el tipo completo
  // Database['public']['Tables']['users']['Row'] (= DbUser).
  //
  // Usar strings de columnas parciales (ej: 'id, username, is_active')
  // produce `data: never` en strict mode porque el parser de template
  // literal types de @supabase/supabase-js v2 falla al resolverlos
  // con ciertos compiladores TypeScript 5.x.
  const { data: user, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  // Tras select('*') + single(), TypeScript infiere `user` como DbUser | null.
  // El cast explícito es defensa adicional por si la inferencia genérica
  // del cliente Supabase difiere entre versiones del paquete.
  const typedUser = user as DbUser | null

  if (dbError || !typedUser) {
    return { success: false, error: 'Usuario o contraseña incorrectos' }
  }

  if (!typedUser.is_active) {
    return { success: false, error: 'Esta cuenta ha sido desactivada' }
  }

  if (typedUser.is_admin) {
    const isValid = validateAdminPassword(password)
    if (!isValid) {
      return { success: false, error: 'Usuario o contraseña incorrectos' }
    }

    // Marcar password_set en el primer login del admin
    if (!typedUser.password_set) {
      await supabase
        .from('users')
        .update({ password_set: true })
        .eq('id', typedUser.id)
    }
  } else {
    if (!typedUser.password_set || !typedUser.password_hash) {
      return {
        success: false,
        error: 'Cuenta no activada. Usa tu código de activación en /setup',
      }
    }

    const isValidPassword = await bcrypt.compare(password, typedUser.password_hash)
    if (!isValidPassword) {
      return { success: false, error: 'Usuario o contraseña incorrectos' }
    }
  }

  const session = await getSession()
  session.isLoggedIn    = true
  session.userId        = typedUser.id
  session.username      = typedUser.username
  session.displayName   = typedUser.display_name
  session.isAdmin       = typedUser.is_admin
  await session.save()

  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// signOut
// ══════════════════════════════════════════════════════════════

export async function signOut(): Promise<never> {
  const session = await getSession()
  session.destroy()
  redirect('/login')
}

// ══════════════════════════════════════════════════════════════
// activateAccount
// ══════════════════════════════════════════════════════════════

export async function activateAccount(rawData: unknown): Promise<AuthActionResult> {
  const parsed = setupPasswordSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? 'Datos de entrada inválidos',
    }
  }
  const { username, setup_token, password } = parsed.data

  const supabase = createSupabaseServer()

  // 1. Buscar usuario pendiente de activación — select('*') por la misma
  //    razón que en signIn: evitar `data: never` en strict mode.
  const { data: user, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password_set', false)
    .single()

  const typedUser = user as DbUser | null

  if (dbError || !typedUser) {
    return {
      success: false,
      error: 'Usuario no encontrado o la cuenta ya está activada',
    }
  }

  if (!typedUser.is_active) {
    return { success: false, error: 'Esta cuenta ha sido desactivada' }
  }

  // 2. Verificar el setup_token en memoria (mensajes de error específicos)
  if (!typedUser.setup_token || typedUser.setup_token !== setup_token) {
    return { success: false, error: 'Código de activación incorrecto' }
  }

  if (
    typedUser.setup_token_expires_at &&
    new Date(typedUser.setup_token_expires_at) < new Date()
  ) {
    return {
      success: false,
      error: 'El código de activación ha expirado. Contacta al administrador',
    }
  }

  // 3. Hashear contraseña (~250ms intencional — dificulta fuerza bruta)
  const passwordHash = await bcrypt.hash(password, 12)

  // 4. UPDATE atómico con guardia TOCTOU:
  //    .eq('setup_token', setup_token) garantiza que si regenerateSetupToken
  //    cambió el token entre el SELECT y este UPDATE, la condición falla
  //    y .single() convierte 0 filas en error → no se activa la cuenta.
  const { data: activated, error: updateError } = await supabase
    .from('users')
    .update({
      password_hash:          passwordHash,
      password_set:           true,
      setup_token:            null,
      setup_token_expires_at: null,
    })
    .eq('id', typedUser.id)
    .eq('setup_token', setup_token)
    .eq('password_set', false)
    .select('id')
    .single()

  if (updateError || !activated) {
    console.error(
      '[activateAccount] UPDATE fallido — posible race condition',
      updateError?.message
    )
    return {
      success: false,
      error: 'El código de activación ya no es válido. Solicita uno nuevo al administrador',
    }
  }

  // 5. Crear sesión — el usuario queda logueado directamente tras activar
  const session = await getSession()
  session.isLoggedIn  = true
  session.userId      = typedUser.id
  session.username    = typedUser.username
  session.displayName = typedUser.display_name
  session.isAdmin     = typedUser.is_admin
  await session.save()

  return { success: true }
}
