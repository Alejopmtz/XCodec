import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Cliente Supabase para el navegador.
 * Propósito único: suscripciones Realtime en el chat.
 *
 * Usa la anon key (seguro porque):
 *   1. El middleware garantiza que solo usuarios autenticados llegan a /chat.
 *   2. Todas las mutaciones (INSERT, UPDATE) pasan por Server Actions,
 *      nunca directamente desde el cliente.
 *   3. Solo se usa para escuchar eventos, no para escribir datos.
 *
 * Singleton: una sola instancia por pestaña del navegador.
 */

let instance: SupabaseClient<Database> | null = null

export function createSupabaseBrowser(): SupabaseClient<Database> {
  if (instance) return instance

  instance = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  )

  return instance
}
