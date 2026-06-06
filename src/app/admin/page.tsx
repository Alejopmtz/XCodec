import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminShell } from '@/components/admin/AdminShell'
import { getUsers } from '@/actions/users'
import { sessionOptions, type SessionData } from '@/lib/session'

export const metadata = { title: 'Admin · XCodec' }

export default async function AdminPage() {
  /* ── Verificar sesión admin ────────────────────────────── */
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn || !session.isAdmin) {
    redirect('/login')
  }

  /* ── Cargar usuarios ───────────────────────────────────── */
  const result = await getUsers()

  if (!result.success) {
    return (
      <div className="flex min-h-screen flex-col bg-base">
        <AdminHeader />
        <div className="flex flex-1 items-center justify-center">
          <p className="font-mono text-sm text-signal-red">
            Error al cargar usuarios: {result.error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-base">
      <AdminHeader />
      <AdminShell
        users={result.users}
        currentUserId={session.userId}
      />
    </div>
  )
}
