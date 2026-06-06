import { z } from 'zod'

// ── Login ─────────────────────────────────────────────────────
// Usado en /login para todos los usuarios (admin y normales).
// La validación del tipo de autenticación ocurre en el Server Action.

export const loginSchema = z.object({
  username: z
    .string({ required_error: 'El usuario es requerido' })
    .min(2, 'Mínimo 2 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(1, 'La contraseña es requerida')
    .max(200, 'Contraseña demasiado larga'),
})

// ── Primer acceso ─────────────────────────────────────────────
// Usado en /setup para activar una cuenta nueva.

export const setupPasswordSchema = z
  .object({
    username: z
      .string({ required_error: 'El usuario es requerido' })
      .min(2, 'Mínimo 2 caracteres')
      .max(30, 'Máximo 30 caracteres')
      .trim()
      .toLowerCase(),
    setup_token: z
      .string({ required_error: 'El código de activación es requerido' })
      .min(1, 'El código de activación es requerido')
      .max(20)
      .trim()
      .toUpperCase(),
    password: z
      .string({ required_error: 'La contraseña es requerida' })
      .min(8, 'Mínimo 8 caracteres')
      .max(72, 'Máximo 72 caracteres'),
    confirm_password: z
      .string({ required_error: 'Confirma tu contraseña' })
      .min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type SetupPasswordInput = z.infer<typeof setupPasswordSchema>
