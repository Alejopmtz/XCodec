import type { NextConfig } from 'next'

// =============================================================
// Cabeceras HTTP de seguridad
//
// Vercel NO añade estas cabeceras automáticamente.
// Se aplican a todas las rutas ('/(.*)')
//
// CSP: ajustada a las dependencias reales de XCodec:
//   - scripts: 'unsafe-inline' necesario por Next.js App Router
//     (hydration bootstrap inline). Sin nonce configurado.
//   - styles:  'unsafe-inline' + Google Fonts (next/font/google)
//   - fonts:   gstatic.com (activos de Google Fonts)
//   - connect: Supabase HTTPS (queries) + WSS (Realtime)
//   - frames:  'none' — ningún iframe puede embeber XCodec
// =============================================================
const SECURITY_HEADERS = [
  // Prefetch DNS para mejorar latencia sin revelar destinos sensibles
  { key: 'X-DNS-Prefetch-Control',   value: 'on' },

  // HSTS: fuerza HTTPS durante 2 años. Vercel ya aplica HTTPS,
  // pero este header instruye al browser a no intentar HTTP nunca.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },

  // Prevenir clickjacking — ningún iframe puede embeber la app
  { key: 'X-Frame-Options',          value: 'DENY' },

  // Prevenir MIME-type sniffing (evita ejecución de uploads maliciosos)
  { key: 'X-Content-Type-Options',   value: 'nosniff' },

  // Limitar información del referrer entre dominios
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },

  // Deshabilitar acceso a hardware sensible (sin videollamadas en MVP)
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },

  // XSS filter en navegadores legacy (Chrome/Safari modernos usan CSP)
  { key: 'X-XSS-Protection',         value: '1; mode=block' },

  // Content Security Policy — restrictiva según dependencias reales
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js App Router inyecta scripts inline para hydration
      "script-src 'self' 'unsafe-inline'",
      // TailwindCSS inline + Google Fonts CSS
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Activos de Google Fonts (next/font/google descarga en build,
      // pero el browser puede cargar desde gstatic en fallback)
      "font-src 'self' https://fonts.gstatic.com",
      // Imágenes locales, data URIs y blob (avatares generados por canvas)
      "img-src 'self' data: blob:",
      // Supabase REST (service_role + anon) y WebSocket Realtime
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      // Bloquear embebido en cualquier frame (refuerza X-Frame-Options)
      "frame-ancestors 'none'",
      // Solo permite submit de formularios al propio dominio
      "form-action 'self'",
      // Previene inyección de base href
      "base-uri 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // React Strict Mode: detecta side effects y warnings en desarrollo.
  // No tiene efecto en producción (Vercel).
  reactStrictMode: true,

  // XCodec no usa next/image — sin avatares externos ni imágenes cargadas
  // desde URLs remotas en MVP. `unoptimized: true` evita consumir la quota
  // de Image Optimization de Vercel (limitada en plan Hobby: 1000 imágenes/mes).
  // Si en el futuro se añaden imágenes, eliminar esta opción y configurar
  // `remotePatterns` con los dominios permitidos.
  images: {
    unoptimized: true,
  },

  // Inyectar cabeceras de seguridad en todas las respuestas HTTP
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ]
  },
}

export default nextConfig
