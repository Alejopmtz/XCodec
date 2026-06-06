-- =============================================================
-- MIGRACIÓN 006 — Señalización servidor → clientes (system_events)
-- =============================================================
--
-- PROBLEMA QUE RESUELVE:
--   clearAllMessages() borraba los mensajes en el servidor pero
--   delegaba la señal de sincronización al navegador del admin
--   (broadcast Supabase vía WebSocket). Si el tab se cerraba o
--   la conexión fallaba entre el DELETE y el broadcast, los
--   clientes conectados conservaban mensajes obsoletos en memoria.
--
-- ARQUITECTURA NUEVA:
--
--   Server Action
--     └── supabase.rpc('clear_all_messages')
--           ├── DELETE FROM messages          ─┐ transacción
--           └── UPDATE system_events           ─┘ atómica
--                    │
--                    ▼ PostgreSQL WAL (al confirmar la transacción)
--              Supabase Realtime
--                    │ postgres_changes UPDATE
--                    ▼
--              useRealtimeSystem (cliente)
--                    └── chatStore.reset()
--
-- GARANTÍA DE CONSISTENCIA:
--   clear_all_messages() es una función PL/pgSQL que ejecuta
--   ambas instrucciones en la misma transacción implícita.
--   Si el DELETE tiene éxito, el UPDATE SIEMPRE ocurre.
--   Si cualquiera falla, la transacción se revierte completa.
--   La señal la emite PostgreSQL vía WAL — no el navegador del admin.
--   No existe escenario donde los mensajes queden borrados sin
--   que los clientes reciban la actualización (salvo fallo de red
--   entre Supabase Realtime y el cliente, inherente a cualquier
--   sistema distribuido y no resoluble en la capa de aplicación).
-- =============================================================


-- ── Tabla: system_events ────────────────────────────────────
--
-- Una fila por tipo de evento de sistema.
-- El campo `updated_at` actúa como versión/vector de reloj:
-- su modificación dispara el postgres_changes UPDATE que
-- Supabase Realtime entrega a los suscriptores.

CREATE TABLE IF NOT EXISTS public.system_events (
  key        text        PRIMARY KEY,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.system_events
  IS 'Señalización servidor→clientes vía postgres_changes. Una fila por evento.';
COMMENT ON COLUMN public.system_events.updated_at
  IS 'Versión del evento. Su cambio dispara el Realtime UPDATE a los clientes.';


-- ── Fila inicial ─────────────────────────────────────────────

INSERT INTO public.system_events (key, updated_at)
  VALUES ('chat_cleared', now())
  ON CONFLICT (key) DO NOTHING;


-- ── RLS: requerido para postgres_changes con rol anon ────────
--
-- Supabase Realtime evalúa las políticas del rol anon antes de
-- entregar eventos postgres_changes. Sin RLS habilitado y sin
-- una política SELECT, los eventos se emiten pero no se entregan
-- al cliente con anon key (fallo silencioso idéntico al de la
-- tabla messages antes de la migración 005).

ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_system_events" ON public.system_events;
CREATE POLICY "anon_read_system_events"
  ON public.system_events
  FOR SELECT
  TO anon
  USING (true);

GRANT SELECT ON public.system_events TO anon;


-- ── Publicación Realtime ─────────────────────────────────────
--
-- Añadir system_events al conjunto de tablas monitorizadas por
-- el motor de replicación lógica de Supabase.
-- Sin esta línea, postgres_changes no entrega eventos de esta tabla
-- aunque la suscripción se establezca sin error.

ALTER PUBLICATION supabase_realtime ADD TABLE public.system_events;


-- =============================================================
-- FUNCIÓN: clear_all_messages()
-- =============================================================
--
-- Borra todos los mensajes Y actualiza system_events en una
-- única transacción. La atomicidad proviene del bloque PL/pgSQL:
-- ambas instrucciones comparten la misma transacción implícita.
--
-- SECURITY DEFINER: se ejecuta con los privilegios del owner
-- (rol postgres), lo que garantiza que el DELETE y el UPDATE
-- funcionan independientemente de las políticas RLS activas.
--
-- SET search_path = public: previene ataques de search_path
-- injection que podrían redirigir las instrucciones a un
-- esquema diferente.

CREATE OR REPLACE FUNCTION public.clear_all_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Borrado físico e irreversible de todos los mensajes.
  DELETE FROM public.messages;

  -- Actualizar el vector de reloj del evento.
  -- Este UPDATE es lo que Supabase Realtime captura vía WAL
  -- y entrega a los clientes como postgres_changes UPDATE.
  UPDATE public.system_events
  SET    updated_at = now()
  WHERE  key = 'chat_cleared';
END;
$$;

COMMENT ON FUNCTION public.clear_all_messages()
  IS 'Borra todos los mensajes y señaliza clientes vía system_events. Transacción atómica.';


-- ── Permisos de ejecución ────────────────────────────────────
--
-- Por defecto PostgreSQL otorga EXECUTE a PUBLIC al crear
-- una función. Se revoca explícitamente y se otorga solo a
-- service_role (el rol que usan los Server Actions server-side).
-- El rol anon (browser) NO puede invocar esta función directamente.

REVOKE EXECUTE ON FUNCTION public.clear_all_messages() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.clear_all_messages() TO service_role;
