-- =============================================================
-- MIGRACIÓN 004 — Permisos para el rol anon
-- XCodec: requerido para Supabase Realtime y queries del cliente
-- =============================================================
--
-- Contexto:
--   XCodec no usa Supabase Auth ni RLS. Toda la autenticación
--   ocurre en la capa de aplicación (iron-session + Server Actions).
--   El cliente browser necesita la anon key para dos propósitos:
--
--   1. Supabase Realtime (postgres_changes):
--      Para recibir eventos INSERT/UPDATE en messages, el motor
--      de replicación de Supabase evalúa si el rol anon tiene
--      SELECT sobre la tabla. Sin este permiso, la suscripción
--      se establece pero no entrega ningún evento (fallo silencioso).
--
--   2. Queries directas desde el browser:
--      useRealtimeMessages enriquece mensajes con datos del sender
--      llamando a supabase.from('users').select('username, display_name').
--      Sin SELECT en users, estas queries retornan null sin error.
--
--   3. RPC get_messages_page (paginación):
--      useMessages llama a supabase.rpc('get_messages_page').
--      La función es SECURITY DEFINER (corre como su creador),
--      pero el rol anon necesita EXECUTE para invocarla.
--
-- Seguridad:
--   - Las mutaciones (INSERT en messages) NUNCA ocurren desde el
--     cliente con anon key. Solo pasan por Server Actions que usan
--     SUPABASE_SERVICE_ROLE_KEY server-side.
--   - El acceso a users está limitado a las columnas públicas del
--     perfil. password_hash y setup_token NUNCA se exponen.
--   - El middleware garantiza que solo usuarios autenticados llegan
--     a /chat (donde se crean estas suscripciones).
-- =============================================================


-- ── messages: SELECT para Realtime y consultas de historial ──

GRANT SELECT ON public.messages TO anon;


-- ── users: solo columnas del perfil público ──────────────────
-- Nunca exponer: password_hash, setup_token, setup_token_expires_at,
-- created_by. Solo el perfil visible en el chat.

GRANT SELECT (
  id,
  username,
  display_name,
  is_admin,
  is_active,
  last_seen
) ON public.users TO anon;


-- ── get_messages_page: RPC de paginación del historial ───────
-- SECURITY DEFINER → corre como el rol creador (sin RLS).
-- El anon solo necesita permiso de invocación.

GRANT EXECUTE
  ON FUNCTION public.get_messages_page(TIMESTAMPTZ, INTEGER)
  TO anon;


-- ── update_last_seen: heartbeat de presencia ─────────────────
-- Llamado desde /api/heartbeat (Server Action) que ya usa
-- service_role_key. No es estrictamente necesario para anon,
-- pero se concede para consistencia si se usa directamente.

GRANT EXECUTE
  ON FUNCTION public.update_last_seen(UUID)
  TO anon;
