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
 *   - Cambia cada día a medianoche (hora del servidor / UTC).
 *   - La sesión de 7 días permite al admin seguir conectado
 *     sin necesidad de re-autenticar cada día.
 *   - Solo es necesaria para NUEVOS inicios de sesión.
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
