-- =============================================================
-- MIGRACIÓN 005 — Row Level Security
-- =============================================================
--
-- PROBLEMA QUE RESUELVE:
--   Sin RLS, Supabase PostgREST ignora los GRANT de columnas
--   definidos en la migración 004 y expone TODA la tabla al rol
--   anon. Cualquier cliente con la publishable/anon key puede leer:
--     - users.password_hash  (hashes bcrypt)
--     - users.setup_token    (códigos de activación one-time)
--     - users.created_by, setup_token_expires_at, etc.
--
-- Con RLS habilitado, PostgREST usa el rol real del JWT (anon),
-- y entonces los GRANT de columnas de la migración 004 toman efecto.
--
-- COMPORTAMIENTO ESPERADO TRAS ESTA MIGRACIÓN:
--   anon key + SELECT (id, username, display_name, ...)  → 200 ✅
--   anon key + SELECT password_hash                      → 403 ✅
--   anon key + SELECT setup_token                        → 403 ✅
--   service_role key (server) → bypassa RLS, acceso total ✅
--   Realtime INSERT/UPDATE events → siguen llegando       ✅
--
-- =============================================================


-- ── Tabla users ──────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- El rol anon puede leer FILAS de users.
-- Las COLUMNAS visibles quedan restringidas por los GRANT de columnas
-- de la migración 004 (solo id, username, display_name, is_admin,
-- is_active, last_seen). password_hash, setup_token, etc. → denegado.
CREATE POLICY "anon_read_profiles"
  ON public.users
  FOR SELECT
  TO anon
  USING (true);


-- ── Tabla messages ────────────────────────────────────────────

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- El rol anon puede leer todos los mensajes.
-- Necesario para:
--   1. useRealtimeMessages: suscripción postgres_changes
--   2. useMessages: invoca get_messages_page (SECURITY DEFINER,
--      no afectado por RLS, pero el anon necesita EXECUTE ya concedido)
CREATE POLICY "anon_read_messages"
  ON public.messages
  FOR SELECT
  TO anon
  USING (true);


-- ── Nota sobre service_role ───────────────────────────────────
-- El rol service_role bypassa RLS automáticamente en Supabase.
-- Las Server Actions y Route Handlers (que usan SUPABASE_SERVICE_ROLE_KEY)
-- no se ven afectados por estas políticas.
-- =============================================================
