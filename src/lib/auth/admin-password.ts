/**
 * Contraseña dinámica del administrador — XCodec
 *
 * Formato : XC + DD + MM + YY + D
 * Ejemplo : 06/06/2026 → XC060626D (en zona America/Bogota)
 *           07/06/2026 → XC070626D
 *
 * Reglas de diseño:
 *   - La contraseña se genera en el servidor en tiempo de ejecución.
 *   - Nunca se almacena en base de datos ni en logs.
 *   - Cambia cada día a medianoche America/Bogota (UTC-5).
 *   - La sesión de 7 días permite al admin seguir conectado
 *     sin necesidad de re-autenticar cada día.
 *   - Solo es necesaria para NUEVOS inicios de sesión.
 *
 * ZONA HORARIA:
 *   La fecha se calcula en America/Bogota mediante getBogotaDateParts()
 *   (src/lib/timezone.ts). Funciona igual en local y en Vercel (UTC).
 *   La contraseña cambia a las 00:00 Bogota = 05:00 UTC.
 */

import { getBogotaDateParts } from '@/lib/timezone'

/**
 * Genera la contraseña esperada para la fecha actual en Bogota.
 * @param ref - Fecha de referencia (por defecto: ahora). Usada en tests.
 */
export function generateAdminPassword(ref?: Date): string {
  const { day, month, year } = getBogotaDateParts(ref)
  const dd = String(day).padStart(2, '0')
  const mm = String(month).padStart(2, '0')
  const yy = String(year).slice(-2)
  return `XC${dd}${mm}${yy}D`
}

/**
 * Valida la contraseña del administrador contra la esperada hoy.
 * Usa comparación de tiempo constante para prevenir timing attacks.
 * @param input - Contraseña introducida por el admin
 */
export function validateAdminPassword(input: string): boolean {
  if (!input || typeof input !== 'string') return false

  const expected = generateAdminPassword()

  // Misma longitud es condición necesaria
  if (input.length !== expected.length) return false

  // XOR bit a bit — siempre recorre todos los caracteres
  // independientemente de cuándo difieren (timing constante)
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= input.charCodeAt(i) ^ expected.charCodeAt(i)
  }

  return diff === 0
}
