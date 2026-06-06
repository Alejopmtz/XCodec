import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Cliente Supabase para uso exclusivo en el servidor.
 * Usa la service_role_key que bypasa cualquier política de seguridad.
 *
 * NUNCA importar este módulo desde componentes cliente ('use client').
 * Solo válido en: Server Actions, Route Handlers, Server Components.
 */
export function createSupabaseServer() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no está definido')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está definido')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        // No necesitamos sesiones de Supabase Auth — usamos iron-session
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
