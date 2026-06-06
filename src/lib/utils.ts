import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ── cn — merge de clases Tailwind ────────────────────────────
// Combina clsx (evaluación condicional) con tailwind-merge
// (deduplicación inteligente de clases utilitarias de Tailwind).
// Requerido por los componentes de shadcn/ui.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Paleta de colores para avatares ──────────────────────────
// Mismos colores que USERNAME_COLORS en MessageItem.tsx.
// Mantener sincronizados si se modifica la paleta.
const AVATAR_COLORS = [
  '#58a6ff', // azul
  '#3fb950', // verde
  '#d29922', // ámbar
  '#bc8cff', // violeta
  '#f78166', // salmón
  '#39d4a5', // turquesa
  '#e3b341', // dorado
  '#ff7b72', // rojo suave
] as const

// ── getUserColor — color determinístico por identificador ─────
// Recibe cualquier string (userId, username, etc.) y devuelve
// un color consistente de la paleta basado en un hash simple.
// El mismo input siempre produce el mismo color.
export function getUserColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!
}

// ── getInitials — iniciales de un nombre de display ──────────
// Toma las primeras dos palabras del nombre y extrae su inicial
// en mayúscula. Ej: "Ana García" → "AG", "Pedro" → "P".
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}
