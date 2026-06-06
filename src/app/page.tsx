// Ruta raíz — el middleware en src/middleware.ts intercepta todas
// las peticiones a '/' y redirige a /chat o /login según el estado
// de la sesión, por lo que esta página normalmente nunca se renderiza.
//
// Se incluye para satisfacer el requisito de Next.js App Router de
// tener un handler en cada ruta que no sea solo un redirect de
// middleware, y como fallback defensivo.

export default function RootPage() {
  // La respuesta HTTP del middleware llega antes de que Next.js
  // llegue a renderizar este componente en producción.
  // En desarrollo (Fast Refresh), puede parpadear brevemente.
  return null
}
