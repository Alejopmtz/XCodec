-- =============================================================
-- MIGRACIÓN 003 — Funciones de utilidad
-- XCodec: helpers para operaciones frecuentes
-- =============================================================


-- =============================================================
-- FUNCIÓN: expire_setup_tokens
-- Limpieza de tokens de activación expirados.
-- =============================================================
-- Propósito: evitar que tokens caducados permanezcan en DB
-- indefinidamente. Un usuario con token expirado mantiene
-- password_set = false y is_active = true; el admin debe
-- regenerar su token desde el panel.
--
-- Llamada desde: puede invocarse manualmente o programarse
-- como cron en Supabase (pg_cron) si se requiere limpieza
-- automática. En MVP, se llama desde el Server Action de login
-- como efecto secundario.

CREATE OR REPLACE FUNCTION public.expire_setup_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.users
  SET
    setup_token            = NULL,
    setup_token_expires_at = NULL
  WHERE
    setup_token IS NOT NULL
    AND setup_token_expires_at < NOW()
    AND password_set = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.expire_setup_tokens()
  IS 'Limpia setup_tokens vencidos. Retorna número de filas afectadas.';


-- =============================================================
-- FUNCIÓN: update_last_seen(p_user_id UUID)
-- Actualiza el timestamp de presencia del usuario.
-- =============================================================
-- Llamada desde: Server Action en /chat cada 30 segundos.
-- Se implementa como función SQL para:
--   1. Centralizar la lógica de actualización.
--   2. Evitar un UPDATE directo desde el cliente con la anon key.
--   3. Poder añadir lógica adicional en el futuro (e.g. logging).

CREATE OR REPLACE FUNCTION public.update_last_seen(p_user_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.users
  SET last_seen = NOW()
  WHERE id = p_user_id AND is_active = true;
$$;

COMMENT ON FUNCTION public.update_last_seen(UUID)
  IS 'Actualiza last_seen del usuario. Llamada cada 30s desde el chat.';


-- =============================================================
-- FUNCIÓN: get_messages_page
-- Paginación por cursor para el historial de chat.
-- =============================================================
-- Retorna hasta `p_limit` mensajes anteriores a `p_cursor`.
-- Si p_cursor es NULL, retorna los más recientes (carga inicial).
--
-- Retorna filas con datos del sender incluidos (JOIN interno)
-- para evitar N+1 queries en la carga de historial.

CREATE OR REPLACE FUNCTION public.get_messages_page(
  p_cursor    TIMESTAMPTZ DEFAULT NULL,
  p_limit     INTEGER     DEFAULT 50
)
RETURNS TABLE (
  id            UUID,
  content       TEXT,
  is_deleted    BOOLEAN,
  created_at    TIMESTAMPTZ,
  sender_id     UUID,
  sender_username     TEXT,
  sender_display_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    m.id,
    m.content,
    m.is_deleted,
    m.created_at,
    u.id          AS sender_id,
    u.username    AS sender_username,
    u.display_name AS sender_display_name
  FROM public.messages m
  JOIN public.users u ON u.id = m.sender_id
  WHERE
    (p_cursor IS NULL OR m.created_at < p_cursor)
  ORDER BY m.created_at DESC
  LIMIT LEAST(p_limit, 100);  -- límite duro: nunca más de 100 por página
$$;

COMMENT ON FUNCTION public.get_messages_page(TIMESTAMPTZ, INTEGER)
  IS 'Historial paginado por cursor. Incluye datos del sender. Máx 100 por página.';


-- =============================================================
-- FUNCIÓN: regenerate_setup_token(p_user_id UUID)
-- El admin regenera el token de activación para un usuario.
-- =============================================================
-- Solo útil si el token expiró o el usuario perdió el código.
-- Retorna el nuevo token para que el admin lo comparta.
-- La validación de que el caller es admin se hace en el
-- Server Action (no aquí — no tenemos auth.uid() disponible).

CREATE OR REPLACE FUNCTION public.regenerate_setup_token(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_token TEXT;
  v_user_exists BOOLEAN;
BEGIN
  -- Verificar que el usuario existe, está activo y no ha activado
  SELECT EXISTS(
    SELECT 1 FROM public.users
    WHERE id = p_user_id
      AND is_active = true
      AND password_set = false
  ) INTO v_user_exists;

  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'Usuario no encontrado, ya activado, o inactivo.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Generar token: 8 caracteres alfanuméricos en mayúscula
  -- usando pgcrypto para aleatoriedad criptográfica
  v_new_token := upper(
    substring(
      encode(gen_random_bytes(6), 'hex')
      FROM 1 FOR 8
    )
  );

  UPDATE public.users
  SET
    setup_token            = v_new_token,
    setup_token_expires_at = NOW() + INTERVAL '7 days'
  WHERE id = p_user_id;

  RETURN v_new_token;
END;
$$;

COMMENT ON FUNCTION public.regenerate_setup_token(UUID)
  IS 'Regenera setup_token para un usuario no activado. Retorna el nuevo token.';
