import { z } from 'zod'

export const createUserSchema = z.object({
  display_name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, 'Mínimo 2 caracteres')
    .max(60, 'Máximo 60 caracteres')
    .trim(),
  username: z
    .string({ required_error: 'El usuario es requerido' })
    .min(2, 'Mínimo 2 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y _')
    .trim()
    .toLowerCase(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
