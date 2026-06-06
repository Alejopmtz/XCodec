-- =============================================================
-- SEED — Usuario administrador inicial
-- XCodec: ejecutar UNA SOLA VEZ tras aplicar las migraciones
-- =============================================================
--
-- INSTRUCCIONES DE USO:
--
--   Opción A — Supabase CLI (local):
--     npx supabase db reset   (aplica migraciones + este seed)
--
--   Opción B — Supabase Dashboard (producción):
--     Abrir SQL Editor en supabase.com/dashboard
--     Pegar y ejecutar este archivo
--
--   Opción C — CLI directo:
--     npx supabase db push    (solo migraciones)
--     Luego ejecutar este seed manualmente en el SQL Editor
--
-- DESPUÉS DE EJECUTAR:
--   1. El admin inicia en http://localhost:3000/setup
--   2. Username:          admin
--   3. Código activación: VER ABAJO (campo setup_token)
--   4. El sistema pedirá crear una contraseña
--   5. Tras activar, el admin accede a /chat y /admin
--
-- ¡CAMBIAR EL SETUP_TOKEN ANTES DE DEPLOY A PRODUCCIÓN!
-- =============================================================


-- Limpiar si existe (útil para re-ejecutar en desarrollo)
DELETE FROM public.users WHERE username = 'admin';


-- Insertar administrador
-- setup_token: XCADMIN1 (cambiar en producción)
-- Expiración: 30 días desde ahora (margen amplio para primer deploy)
INSERT INTO public.users (
  id,
  username,
  display_name,
  password_hash,
  password_set,
  setup_token,
  setup_token_expires_at,
  is_admin,
  is_active,
  created_by
) VALUES (
  gen_random_uuid(),        -- id
  'admin',                  -- username: para login
  'Administrador',          -- display_name: visible en el chat
  NULL,                     -- password_hash: NULL hasta activación
  false,                    -- password_set: fuerza flujo /setup
  'XCADMIN1',               -- setup_token: ¡CAMBIAR EN PRODUCCIÓN!
  NOW() + INTERVAL '30 days', -- 30 días para activar en primer deploy
  true,                     -- is_admin: único administrador
  true,                     -- is_active
  NULL                      -- created_by: NULL porque no hay otro admin aún
);


-- =============================================================
-- VERIFICACIÓN POST-SEED
-- Ejecutar para confirmar que el seed fue correcto
-- =============================================================

-- Debería retornar 1 fila con is_admin=true y password_set=false
SELECT
  id,
  username,
  display_name,
  is_admin,
  password_set,
  setup_token,
  setup_token_expires_at,
  is_active,
  created_at
FROM public.users
WHERE username = 'admin';
