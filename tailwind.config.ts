import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Tipografía ─────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Tamaño menor que xs (10px/14px line-height)
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },

      // ── Paleta de colores del design system ────────────────────
      //
      // Todos estos colores son accesibles como:
      //   bg-{token}         → fondo
      //   text-{token}       → color de texto
      //   border-{token}     → color de borde
      //   {token}/[opacity]  → con modificador de opacidad (ej: bg-raised/50)
      //
      colors: {
        // Backgrounds (oscuro a claro)
        base:    '#0d1117',   // Fondo raíz de la app
        surface: '#161b22',   // Cards, paneles
        raised:  '#21262d',   // Hover states, elementos elevados
        overlay: '#2d333b',   // Dropdowns, popovers, inputs
        active:  '#30363d',   // Estado activo/seleccionado

        // Textos (claro a muted)
        text: {
          DEFAULT:   '#e6edf3',  // Texto principal
          secondary: '#8b949e',  // Texto secundario
          muted:     '#6e7681',  // Texto apagado, placeholders
        },

        // Bordes
        border: {
          DEFAULT: '#30363d',  // Borde estándar
          subtle:  '#21262d',  // Borde muy sutil (separadores)
        },

        // Señales semánticas
        signal: {
          green: '#3fb950',   // Éxito, online, activo
          red:   '#f85149',   // Error, peligro, eliminar
          amber: '#d29922',   // Advertencia, pendiente
          blue:  '#58a6ff',   // Información, links
          gold:  '#e3b341',   // Admin, premium, especial
        },
      },

      // ── Alturas ────────────────────────────────────────────────
      height: {
        header: '3rem',  // 48px — header del panel admin
      },

      // ── Sombras ────────────────────────────────────────────────
      boxShadow: {
        'glow-red':    '0 0 12px rgba(248, 81,  73,  0.35)',
        'glow-green':  '0 0 12px rgba(63,  185, 80,  0.35)',
        'elevation-2': '0 8px 24px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
      },

      // ── Animaciones ────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'shake': {
          '0%, 100%':               { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%':      { transform: 'translateX(4px)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.15s ease-out',
        'shake':    'shake 0.4s ease-in-out',
        'slide-up': 'slide-up 0.2s ease-out',
      },
    },
  },

  plugins: [
    // ── Componentes utilitarios del design system ─────────────────
    // Definen las clases xc-* usadas en todos los componentes.
    plugin(function ({ addComponents, addUtilities }) {
      addComponents({
        // ── Card ──────────────────────────────────────────────────
        '.xc-card': {
          '@apply rounded-xl border border-border bg-surface': {},
          boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
        },

        // ── Input ─────────────────────────────────────────────────
        '.xc-input': {
          '@apply w-full rounded-md border border-border bg-overlay px-3 py-2': {},
          '@apply font-mono text-sm text-text placeholder:text-text-muted': {},
          '@apply focus:outline-none focus:border-signal-green': {},
          '@apply transition-colors duration-150': {},
          '&:focus': {
            boxShadow: '0 0 0 3px rgba(63,185,80,0.12)',
          },
        },

        // ── Botón primario ────────────────────────────────────────
        '.xc-btn-primary': {
          '@apply inline-flex items-center justify-center gap-2 rounded-md': {},
          '@apply bg-signal-green px-4 py-2 font-mono font-semibold text-sm': {},
          '@apply text-base hover:opacity-90': {},
          '@apply disabled:opacity-40 disabled:cursor-not-allowed': {},
          '@apply transition-opacity duration-150': {},
        },

        // ── Botón secundario ──────────────────────────────────────
        '.xc-btn-secondary': {
          '@apply inline-flex items-center justify-center gap-2 rounded-md': {},
          '@apply border border-border bg-raised px-4 py-2': {},
          '@apply font-mono text-sm text-text-secondary': {},
          '@apply hover:bg-overlay hover:text-text': {},
          '@apply disabled:opacity-40 disabled:cursor-not-allowed': {},
          '@apply transition-colors duration-150': {},
        },

        // ── Botón ghost ───────────────────────────────────────────
        '.xc-btn-ghost': {
          '@apply inline-flex items-center justify-center gap-2 rounded-md': {},
          '@apply px-3 py-1.5 font-mono text-sm text-text-muted': {},
          '@apply hover:bg-raised hover:text-text': {},
          '@apply disabled:opacity-40 disabled:cursor-not-allowed': {},
          '@apply transition-colors duration-150': {},
        },

        // ── Label de formulario ───────────────────────────────────
        '.xc-label': {
          '@apply block font-mono text-xs text-text-muted mb-1.5': {},
          letterSpacing: '0.08em',
        },
      })

      addUtilities({
        // ── Fondo de grid (login page) ────────────────────────────
        '.xc-bg-grid': {
          backgroundImage: [
            'linear-gradient(rgba(48,54,61,0.4) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(48,54,61,0.4) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '32px 32px',
        },
      })
    }),
  ],
}

export default config
