/**
 * Contraseña dinámica del administrador — XCodec
 *
 * Formato : XC + DD + MM + YY + D
 * Ejemplo : 06/06/2026 → XC060626D
 *           07/06/2026 → XC070626D
 *
 * Reglas de diseño:
 *   - La contraseña se genera en el servidor en tiempo de ejecución.
 *   - Nunca se almacena en base de datos ni en logs.
 *   - Cambia cada día a medianoche UTC (no hora local del admin).
 *   - La sesión de 7 días permite al admin seguir conectado
 *     sin necesidad de re-autenticar cada día.
 *   - Solo es necesaria para NUEVOS inicios de sesión.
 *
 * ⚠️  ZONA HORARIA EN VERCEL (producción):
 *   Vercel ejecuta las funciones en UTC (TZ=UTC sin posibilidad de cambio).
 *   `new Date()` devuelve la hora UTC, NO la hora local del administrador.
 *
 *   Consecuencia práctica:
 *     Si el admin está en UTC+2 (España, verano):
 *       - La contraseña cambia a las 02:00 AM hora local (00:00 UTC).
 *       - Entre medianoche y las 02:00 AM hora local, la contraseña
 *         ya corresponde al día siguiente (fecha UTC).
 *
 *   Ejemplo (España, verano UTC+2):
 *     A las 01:30 AM del 07/06, en el servidor ya es 06/06/2026 23:30 UTC
 *     → la contraseña esperada es XC060626D (día 6), NO XC070626D.
 *     A las 02:01 AM del 07/06, en el servidor ya es 07/06/2026 00:01 UTC
 *     → la contraseña esperada es XC070626D (día 7).
 *
 *   Regla de oro: calcular la contraseña según la FECHA UTC, no la local.
 *   La fecha UTC actual siempre está disponible en: https://time.is/UTC
 */

/**
 * Genera la contraseña esperada para una fecha dada.
 * @param date - Fecha de referencia (por defecto: ahora)
 */
export function generateAdminPassword(date: Date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yy = String(date.getFullYear()).slice(-2)
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
