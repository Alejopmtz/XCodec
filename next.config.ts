import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Habilitar React strict mode para detectar efectos secundarios en desarrollo
  reactStrictMode: true,

  // Configuración de imágenes (no usadas en MVP pero evita warnings futuros)
  images: {
    unoptimized: true,
  },
}

export default nextConfig
