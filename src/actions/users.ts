'use server'

import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { revalidatePath } from 'next/cache'

import { sessionOptions, type SessionData } from '@/lib/session'
import { createUserSchema } from '@/lib/validations/users'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { UserWithStatus } from '@/types/admin'
import type { DbUser } from '@/types/database.types'

// ── Tipos de retorno ──────────────────────────────────────────

export type UserActionResult =
  | { success: false; error: string }
  | { success: true }

export type CreateUserActionResult =
  | { success: false; error?: string; fieldErrors?: Record<string, string> }
  | { success: true; username: string; setup_token: string }

export type RegenerateTokenResult =
  | { success: false; error: string }
  | { success: true; username: string; setup_token: string }

export type GetUsersResult =
  | { success: false; error: string }
  | { success: true; users: UserWithStatus[] }

// ── Helper: verificar admin ───────────────────────────────────
async function requireAdmin(): Promise<SessionData> {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (!session.isLoggedIn || !session.isAdmin) {
    throw new Error('No autorizado')
  }
  return session
}

// ── Generador de token criptográficamente seguro ──────────────
function makeSetupToken(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

// ══════════════════════════════════════════════════════════════
// getUsers — Listado completo de usuarios
// ══════════════════════════════════════════════════════════════
export async function getUsers(): Promise<GetUsersResult> {
  await requireAdmin()

  const supabase = createSupabaseServer()

  // select('*') → infiere DbUser[] sin ambigüedad en TypeScript strict.
  // El cast a UserWithStatus[] es seguro: UserWithStatus es un subconjunto
  // de DbUser (todas sus propiedades existen en la Row completa).
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getUsers]', error.message)
    return { success: false, error: 'Error al cargar usuarios' }
  }

  // Mapear explícitamente en lugar de castear ciegamente: garantiza que
  // UserWithStatus solo expone las columnas definidas, nunca password_hash.
  const users: UserWithStatus[] = (data ?? []).map((row: DbUser) => ({
    id:           row.id,
    username:     row.username,
    display_name: row.display_name,
    is_admin:     row.is_admin,
    is_active:    row.is_active,
    password_set: row.password_set,
    last_seen:    row.last_seen,
    created_at:   row.created_at,
    setup_token:  row.setup_token,
  }))

  return { success: true, users }
}

// ══════════════════════════════════════════════════════════════
// createUser — Crear nuevo usuario
// ══════════════════════════════════════════════════════════════
export async function createUser(
  rawData: unknown
): Promise<CreateUserActionResult> {
  const session = await requireAdmin()

  const parsed = createUserSchema.safeParse(rawData)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.errors) {
      const key = issue.path[0] as string
      if (key) fieldErrors[key] = issue.message
    }
    return { success: false, fieldErrors }
  }
  const { display_name, username } = parsed.data

  const supabase = createSupabaseServer()

  // Verificar duplicado antes de insertar
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'Este nombre de usuario ya está en uso' }
  }

  const setupToken = makeSetupToken()
  const expiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: insertError } = await supabase.from('users').insert({
    username,
    display_name,
    password_hash:          null,
    password_set:           false,
    setup_token:            setupToken,
    setup_token_expires_at: expiresAt,
    is_admin:               false,
    is_active:              true,
    created_by:             session.userId,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: 'Este nombre de usuario ya está en uso' }
    }
    console.error('[createUser]', insertError.message)
    return { success: false, error: 'Error interno al crear el usuario' }
  }

  revalidatePath('/admin')
  return { success: true, username, setup_token: setupToken }
}

// ══════════════════════════════════════════════════════════════
// deactivateUser — Desactivar cuenta
// ══════════════════════════════════════════════════════════════
export async function deactivateUser(
  userId: string
): Promise<UserActionResult> {
  const session = await requireAdmin()

  if (userId === session.userId) {
    return { success: false, error: 'No puedes desactivar tu propia cuenta' }
  }

  const supabase = createSupabaseServer()

  // .select('id').single() detecta 0 filas afectadas (usuario inexistente
  // o intento de desactivar un admin rechazado por .eq('is_admin', false)).
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId)
    .eq('is_admin', false)
    .select('id')
    .single()

  if (error || !data) {
    if (error) console.error('[deactivateUser]', error.message)
    return { success: false, error: 'No se pudo desactivar el usuario' }
  }

  revalidatePath('/admin')
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// reactivateUser — Reactivar cuenta
// ══════════════════════════════════════════════════════════════
export async function reactivateUser(
  userId: string
): Promise<UserActionResult> {
  await requireAdmin()

  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('id', userId)

  if (error) {
    console.error('[reactivateUser]', error.message)
    return { success: false, error: 'Error al reactivar el usuario' }
  }

  revalidatePath('/admin')
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// regenerateSetupToken — Regenerar código de activación
// ══════════════════════════════════════════════════════════════
export async function regenerateSetupToken(
  userId: string
): Promise<RegenerateTokenResult> {
  await requireAdmin()

  const newToken = makeSetupToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const supabase = createSupabaseServer()

  // select('username') sobre UPDATE: Supabase infiere correctamente
  // Pick<DbUser, 'username'> para selects de una sola columna conocida.
  const { data: user, error } = await supabase
    .from('users')
    .update({
      setup_token:            newToken,
      setup_token_expires_at: expiresAt,
    })
    .eq('id', userId)
    .eq('password_set', false)
    .eq('is_active', true)
    .select('username')
    .single()

  if (error || !user) {
    return {
      success: false,
      error: 'Solo se puede regenerar el código en cuentas pendientes de activación',
    }
  }

  revalidatePath('/admin')
  return { success: true, username: user.username, setup_token: newToken }
}
