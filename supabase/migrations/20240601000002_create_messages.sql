-- =============================================================
-- MIGRACIÓN 002 — Tabla messages
-- XCodec: canal de chat único y global
-- =============================================================


-- =============================================================
-- TABLA: messages
-- Historial persistente del único canal de chat de XCodec.
-- Todos los usuarios autorizados leen y escriben en esta tabla.
-- =============================================================

CREATE TABLE public.messages (

  -- ── Identidad ───────────────────────────────────────────────
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- UUID v4. Usado como cursor para paginación y como key de React.
  -- La generación en DB garantiza unicidad sin coordinación de cliente.

  -- ── Contenido ────────────────────────────────────────────────
  sender_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- FK al autor del mensaje.
  -- ON DELETE CASCADE: si el admin elimina un usuario, sus mensajes
  -- desaparecen del historial. Decisión deliberada para sistemas privados.
  -- Alternativa sería ON DELETE SET NULL con sender nullable, pero
  -- complica la UI ("usuario eliminado") sin beneficio real aquí.

  content    TEXT        NOT NULL,
  -- Texto plano del mensaje. Sin HTML, sin markdown en MVP.
  -- Sanitizado en la Server Action antes de insertar.
  -- CHECK garantiza límites: mínimo 1 char (no mensajes vacíos),
  -- máximo 2000 chars (previene abuso y mensajes enormes en Realtime).

  -- ── Ciclo de vida ────────────────────────────────────────────
  is_deleted BOOLEAN     NOT NULL DEFAULT false,
  -- Soft delete: el mensaje permanece en DB para no romper el historial
  -- (paginación por cursor, conteo de mensajes), pero la UI muestra
  -- "[Mensaje eliminado]" en lugar del contenido.
  -- Solo el admin puede hacer is_deleted = true (validado en Server Action).
  -- No hay hard delete de mensajes individuales por diseño.

  -- ── Timestamps ───────────────────────────────────────────────
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Inmutable. Es el cursor de paginación: la carga de historial
  -- usa WHERE created_at < :cursor ORDER BY created_at DESC LIMIT 50.
  -- No hay updated_at: los mensajes no se editan en MVP.

);


-- =============================================================
-- RESTRICCIONES CHECK
-- =============================================================

-- Contenido: no vacío, máximo 2000 caracteres
-- El trim() previene mensajes de solo espacios en blanco.
ALTER TABLE public.messages
  ADD CONSTRAINT chk_message_content
  CHECK (
    char_length(trim(content)) >= 1
    AND char_length(content) <= 2000
  );


-- =============================================================
-- ÍNDICES
-- =============================================================

-- Índice principal: paginación del historial de chat.
-- La query más frecuente del sistema:
--   SELECT ... FROM messages
--   WHERE created_at < :cursor AND is_deleted = false
--   ORDER BY created_at DESC
--   LIMIT 50
-- El índice parcial (WHERE is_deleted = false) es más pequeño
-- y eficiente que un índice completo ya que la gran mayoría
-- de mensajes no están eliminados.
CREATE INDEX idx_messages_cursor
  ON public.messages (created_at DESC)
  WHERE is_deleted = false;

-- Índice secundario: mensajes de un usuario específico.
-- Útil para el panel admin (ver actividad de un usuario antes de eliminarlo).
-- También cubre el ON DELETE CASCADE de sender_id.
CREATE INDEX idx_messages_sender
  ON public.messages (sender_id, created_at DESC);


-- =============================================================
-- HABILITAR SUPABASE REALTIME
-- =============================================================
-- Añade la tabla al canal de replicación lógica de Supabase.
-- Esto permite que los clientes suscritos reciban eventos
-- INSERT y UPDATE en tiempo real sin polling.
--
-- NOTA DE SEGURIDAD:
-- Sin RLS habilitado, Supabase Realtime transmite los cambios
-- a cualquier cliente con la anon key. En XCodec esto es
-- aceptable porque:
--   1. La anon key solo se usa server-side (Server Actions)
--      excepto para el canal Realtime del chat.
--   2. El middleware garantiza que solo usuarios autenticados
--      llegan a /chat (donde se crea la suscripción Realtime).
--   3. No hay datos sensibles en messages (solo texto de chat).
--
-- Si en el futuro se requiere aislamiento por usuario,
-- se puede habilitar RLS con política: authenticated puede SELECT.
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- =============================================================
-- COMENTARIOS
-- =============================================================

COMMENT ON TABLE  public.messages IS 'Canal de chat único y global de XCodec. Append-only salvo soft delete por admin.';
COMMENT ON COLUMN public.messages.id         IS 'PK UUID v4. Usado como cursor de paginación y React key.';
COMMENT ON COLUMN public.messages.sender_id  IS 'FK a users.id. CASCADE elimina mensajes al borrar usuario.';
COMMENT ON COLUMN public.messages.content    IS 'Texto plano 1-2000 chars. Sanitizado antes de insertar.';
COMMENT ON COLUMN public.messages.is_deleted IS 'Soft delete. UI muestra placeholder, historial intacto.';
COMMENT ON COLUMN public.messages.created_at IS 'Cursor de paginación. Inmutable. Índice DESC para historial.';
