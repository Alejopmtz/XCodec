/**
 * Utilidad centralizada de zona horaria — XCodec
 *
 * TODO el sistema opera en America/Bogota (UTC-5, sin cambio de horario estacional).
 * Colombia no observa DST, por lo que el offset es siempre -05:00.
 *
 * PROBLEMA QUE RESUELVE:
 *   Vercel ejecuta funciones en UTC (TZ=UTC). `new Date()` devuelve hora UTC.
 *   `date.getDate()`, `toLocaleDateString()` sin timeZone explícito usan UTC.
 *   Esto hace que a las 11:30 PM Bogota (= 04:30 AM UTC del día siguiente),
 *   la contraseña del admin, los separadores de fecha del chat y los
 *   formatos de fecha del panel reflejen el día UTC, no el día Bogota.
 *
 * SOLUCIÓN:
 *   Todas las operaciones de fecha/hora del sistema pasan por este módulo,
 *   que utiliza Intl.DateTimeFormat con timeZone: TIMEZONE explícito.
 *   Funciona idénticamente en local (cualquier TZ del host) y en Vercel.
 */

export const TIMEZONE = 'America/Bogota'

// ── Helpers internos ──────────────────────────────────────────

function dtf(opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: TIMEZONE })
}

/** Extrae las partes de fecha de un Date en zona Bogota. */
function bogotaParts(d: Date): { day: number; month: number; year: number } {
  const parts = dtf({
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(d)

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10)

  return { day: get('day'), month: get('month'), year: get('year') }
}

// ── API pública ───────────────────────────────────────────────

/**
 * Devuelve las partes de fecha actuales en zona America/Bogota.
 * Uso principal: generateAdminPassword().
 */
export function getBogotaDateParts(ref?: Date): {
  day: number
  month: number
  year: number
} {
  return bogotaParts(ref ?? new Date())
}

/**
 * Devuelve la clave de fecha (YYYY-MM-DD) del día actual en Bogota.
 */
export function todayKeyInBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date())
  // en-CA produce 'YYYY-MM-DD'
}

/**
 * Convierte un timestamp ISO (UTC) a su clave de fecha (YYYY-MM-DD) en Bogota.
 * Reemplaza `iso.split('T')[0]` que devuelve la fecha UTC, no la local.
 *
 * Ejemplo: '2026-06-07T04:30:00Z' → '2026-06-06' (11:30 PM Bogota)
 */
export function toDateKeyInBogota(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(
    new Date(iso)
  )
}

/**
 * Formatea la hora de un mensaje (HH:MM) en zona Bogota.
 */
export function formatTimeInBogota(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  })
}

/**
 * Devuelve la etiqueta del separador de fecha del chat ("Hoy", "Ayer", fecha).
 * @param isoDateKey - Clave YYYY-MM-DD en zona Bogota (producida por toDateKeyInBogota).
 */
export function formatDateLabelInBogota(isoDateKey: string): string {
  const today     = todayKeyInBogota()
  const yesterday = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(
    new Date(Date.now() - 86_400_000)
  )

  if (isoDateKey === today)     return 'Hoy'
  if (isoDateKey === yesterday) return 'Ayer'

  const thisYear = parseInt(today.slice(0, 4), 10)
  const msgYear  = parseInt(isoDateKey.slice(0, 4), 10)

  // T12:00:00Z → mediodía UTC = 07:00 Bogota: fecha correcta en ambas zonas.
  return new Date(isoDateKey + 'T12:00:00Z').toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: msgYear !== thisYear ? 'numeric' : undefined,
    timeZone: TIMEZONE,
  }).toUpperCase()
}

/**
 * Devuelve texto relativo para la última vez que un usuario estuvo activo,
 * con la fecha de fallback mostrada en zona Bogota.
 */
export function formatLastSeenInBogota(lastSeen: string | null): string {
  if (!lastSeen) return '—'
  const diff = Date.now() - new Date(lastSeen).getTime()
  const secs  = Math.floor(diff / 1000)
  if (secs < 60) return 'Ahora'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  return new Date(lastSeen).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    timeZone: TIMEZONE,
  })
}

/**
 * Devuelve la fecha de creación de un usuario en formato corto (zona Bogota).
 */
export function formatCreatedAtInBogota(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    timeZone: TIMEZONE,
  })
}
