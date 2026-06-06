'use server'

import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { z } from 'zod'
import { sessionOptions, type SessionData } from '@/lib/session'
import { createSupabaseServer } from '@/lib/supabase/server'

// ── Esquemas ──────────────────────────────────────────────────

const sendSchema = z.object({
  content: z.string().trim().min(1, 'Mensaje vacío').max(2000, 'Máximo 2000 caracteres'),
})

// ── Helpers ───────────────────────────────────────────────────

async function requireAuth(): Promise<SessionData> {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (!session.isLoggedIn) throw new Error('No autenticado')
  return session
}

// ══════════════════════════════════════════════════════════════
// sendMessage
// ══════════════════════════════════════════════════════════════

export async function sendMessage(
  rawContent: string
): Promise<{ success: boolean; error?: string }> {
  let session: SessionData
  try {
    session = await requireAuth()
  } catch {
    return { success: false, error: 'No autenticado' }
  }

  const parsed = sendSchema.safeParse({ content: rawContent })
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message }
  }

  const supabase = createSupabaseServer()
  const { error } = await supabase.from('messages').insert({
    content: parsed.data.content,
    sender_id: session.userId,
    is_deleted: false,
  })

  if (error) {
    console.error('[sendMessage]', error.message)
    return { success: false, error: 'Error al enviar el mensaje' }
  }

  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// deleteMessage (solo admin — soft delete)
// ══════════════════════════════════════════════════════════════

export async function deleteMessage(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  let session: SessionData
  try {
    session = await requireAuth()
  } catch {
    return { success: false, error: 'No autenticado' }
  }

  if (!session.isAdmin) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('messages')
    .update({ is_deleted: true })
    .eq('id', messageId)

  if (error) {
    console.error('[deleteMessage]', error.message)
    return { success: false, error: 'Error al eliminar el mensaje' }
  }

  return { success: true }
}
