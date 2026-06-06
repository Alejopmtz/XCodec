'use server'

import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { redirect } from 'next/navigation'

import { sessionOptions, type SessionData } from '@/lib/session'
import { loginSchema, setupPasswordSchema } from '@/lib/validations/auth'
import { validateAdminPassword } from '@/lib/auth/admin-password'
import { createSupabaseServer } from '@/lib/supabase/server'

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
  const { data: user, error: dbError } = await supabase
    .from('users')
    .select(
      'id, username, display_name, password_hash, password_set, is_admin, is_active'
    )
    .eq('username', username)
    .single()

  if (dbError || !user) {
    return { success: false, error: 'Usuario o contraseña incorrectos' }
  }

  if (!user.is_active) {
    return { success: false, error: 'Esta cuenta ha sido desactivada' }
  }

  if (user.is_admin) {
    const isValid = validateAdminPassword(password)
    if (!isValid) {
      return { success: false, error: 'Usuario o contraseña incorrectos' }
    }

    if (!user.password_set) {
      await supabase
        .from('users')
        .update({ password_set: true })
        .eq('id', user.id)
    }
  } else {
    if (!user.password_set || !user.password_hash) {
      return {
        success: false,
        error: 'Cuenta no activada. Usa tu código de activación en /setup',
      }
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return { success: false, error: 'Usuario o contraseña incorrectos' }
    }
  }

  const session = await getSession()
  session.isLoggedIn = true
  session.userId = user.id
  session.username = user.username
  session.displayName = user.display_name
  session.isAdmin = user.is_admin
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

  // 1. Buscar usuario pendiente de activación
  const { data: user, error: dbError } = await supabase
    .from('users')
    .select(
      'id, username, display_name, setup_token, setup_token_expires_at, password_set, is_active, is_admin'
    )
    .eq('username', username)
    .eq('password_set', false)
    .single()

  if (dbError || !user) {
    return {
      success: false,
      error: 'Usuario no encontrado o la cuenta ya está activada',
    }
  }

  if (!user.is_active) {
    return { success: false, error: 'Esta cuenta ha sido desactivada' }
  }

  // 2. Verificar el setup_token en memoria (para mensajes de error específicos)
  if (!user.setup_token || user.setup_token !== setup_token) {
    return { success: false, error: 'Código de activación incorrecto' }
  }

  if (
    user.setup_token_expires_at &&
    new Date(user.setup_token_expires_at) < new Date()
  ) {
    return {
      success: false,
      error: 'El código de activación ha expirado. Contacta al administrador',
    }
  }

  // 3. Hashear contraseña (~250ms intencional — dificulta fuerza bruta)
  const passwordHash = await bcrypt.hash(password, 12)

  // 4. UPDATE atómico: incluye .eq('setup_token', setup_token) como guardia
  //    de race condition (TOCTOU). Si regenerateSetupToken cambió el token
  //    entre el SELECT y este UPDATE, la condición falla y se devuelven 0 filas.
  //    .single() convierte 0 filas en error, evitando activación con token inválido.
  const { data: activated, error: updateError } = await supabase
    .from('users')
    .update({
      password_hash: passwordHash,
      password_set: true,
      setup_token: null,
      setup_token_expires_at: null,
    })
    .eq('id', user.id)
    .eq('setup_token', setup_token)
    .eq('password_set', false)
    .select('id')
    .single()

  if (updateError || !activated) {
    // Si llegamos aquí, el token fue invalidado en la ventana entre SELECT y UPDATE
    console.error('[activateAccount] UPDATE fallido — posible race condition', updateError?.message)
    return {
      success: false,
      error: 'El código de activación ya no es válido. Solicita uno nuevo al administrador',
    }
  }

  // 5. Crear sesión — el usuario queda logueado directamente
  const session = await getSession()
  session.isLoggedIn = true
  session.userId = user.id
  session.username = user.username
  session.displayName = user.display_name
  session.isAdmin = user.is_admin
  await session.save()

  return { success: true }
}
