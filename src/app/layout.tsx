import type { Metadata, Viewport } from 'next'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

// ── Fuente sans-serif — usada para la marca XCODEC ───────────
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// ── Fuente monoespaciada — usada en toda la interfaz ─────────
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'XCodec',
    template: '%s · XCodec',
  },
  description: 'Sistema privado de mensajería cifrada',
  robots: {
    // No indexar — sistema privado
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d1117',
  // Requerido para que env(safe-area-inset-*) tenga efecto en iPhone
  // con notch / Dynamic Island / Home Indicator.
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      // Las variables CSS de fuente se inyectan en el elemento html
      className={`${inter.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-base text-text font-mono antialiased">
        {children}
      </body>
    </html>
  )
}
