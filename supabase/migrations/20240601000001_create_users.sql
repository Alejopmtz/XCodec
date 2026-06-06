-- =============================================================
-- MIGRACIÓN 001 — Tabla users
-- XCodec: autenticación propia (sin Supabase Auth)
-- =============================================================

-- ── Extensiones necesarias ────────────────────────────────────
-- gen_random_uuid() → UUIDs v4 para PKs
-- pgcrypto es nativa en Supabase, no requiere instalación
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =============================================================
-- TABLA: users
-- Fuente única de verdad para identidad y autenticación.
-- No existe auth.users ni tabla profiles separada.
-- =============================================================

CREATE TABLE public.users (

  -- ── Identidad ───────────────────────────────────────────────
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- UUID v4 aleatorio. Se usa como session payload en iron-session.
  -- Inmutable una vez creado.

  username     TEXT        NOT NULL,
  -- Identificador de login. Lowercase, sin espacios.
  -- El usuario lo usa para iniciar sesión.
  -- Inmutable por diseño: cambiarlo rompería referencias y hábitos.

  display_name TEXT        NOT NULL,
  -- Nombre visible en el chat. Puede contener espacios y mayúsculas.
  -- El admin lo define al crear el usuario.
  -- El usuario no puede cambiarlo (sistema privado, admin controla identidades).

  -- ── Autenticación ────────────────────────────────────────────
  password_hash TEXT       NULL,
  -- Hash bcrypt de la contraseña (cost factor 12).
  -- NULL hasta que el usuario completa el primer acceso (/setup).
  -- Nunca se expone fuera de Server Actions.
  -- Formato: $2b$12$... (bcryptjs output)

  password_set  BOOLEAN    NOT NULL DEFAULT false,
  -- false → usuario recién creado, debe pasar por /setup
  -- true  → usuario activo, puede hacer login normal
  -- Controla el flujo de middleware: false fuerza redirect a /setup.

  setup_token   TEXT       NULL,
  -- Token de activación de un solo uso. Generado por el admin al crear usuario.
  -- 8 caracteres alfanuméricos en mayúscula (ej: "A3F7C9E2").
  -- Se borra (SET NULL) cuando el usuario activa su cuenta.
  -- NULL en usuarios ya activados.

  setup_token_expires_at TIMESTAMPTZ NULL,
  -- Expiración del setup_token. Defecto: 7 días desde creación.
  -- Pasado este tiempo, el admin debe regenerar el token.
  -- NULL en usuarios ya activados.

  -- ── Roles ────────────────────────────────────────────────────
  is_admin     BOOLEAN     NOT NULL DEFAULT false,
  -- true solo para el administrador único del sistema.
  -- Controlado por índice parcial único (ver abajo):
  -- no puede existir más de un is_admin = true.

  -- ── Estado ───────────────────────────────────────────────────
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  -- false → usuario desactivado por el admin.
  -- El middleware destruye la sesión si detecta is_active = false.
  -- No se hace DELETE para preservar la autoría de mensajes históricos.

  -- ── Presencia ────────────────────────────────────────────────
  last_seen    TIMESTAMPTZ NULL,
  -- Actualizado periódicamente (cada 30s) mientras el usuario está en /chat.
  -- Permite mostrar "hace X minutos" en el panel de usuarios.
  -- NULL = nunca ha iniciado sesión.

  -- ── Auditoría ────────────────────────────────────────────────
  created_by   UUID        NULL REFERENCES public.users(id) ON DELETE SET NULL,
  -- ID del admin que creó este usuario.
  -- NULL para el primer admin (se crea con el seed, no hay otro admin aún).
  -- SET NULL si el admin que creó al usuario es eliminado (raro pero posible).

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Timestamp de creación. Inmutable.

  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Actualizado automáticamente por trigger set_updated_at.
  -- Registra cualquier modificación al perfil.

);


-- =============================================================
-- RESTRICCIONES CHECK — Reglas de negocio a nivel de base de datos
-- =============================================================

-- username: 2-30 chars, solo minúsculas, números y guión bajo
-- Garantiza que el campo sea usable como identificador técnico.
ALTER TABLE public.users
  ADD CONSTRAINT chk_username_format
  CHECK (
    username ~ '^[a-z0-9_]{2,30}$'
  );

-- display_name: 2-60 chars, no solo espacios en blanco
ALTER TABLE public.users
  ADD CONSTRAINT chk_display_name_length
  CHECK (
    char_length(trim(display_name)) BETWEEN 2 AND 60
  );

-- Coherencia entre password_set y password_hash:
-- Si password_set = true, DEBE existir un hash.
-- Impide estados inconsistentes que romperían el login.
ALTER TABLE public.users
  ADD CONSTRAINT chk_password_coherence
  CHECK (
    (password_set = false)
    OR
    (password_set = true AND password_hash IS NOT NULL)
  );

-- Coherencia del setup_token:
-- Si password_set = true, el token debe estar limpio.
-- Impide tokens huérfanos en cuentas ya activadas.
ALTER TABLE public.users
  ADD CONSTRAINT chk_setup_token_coherence
  CHECK (
    (password_set = false)
    OR
    (password_set = true AND setup_token IS NULL AND setup_token_expires_at IS NULL)
  );


-- =============================================================
-- ÍNDICES
-- =============================================================

-- Login: búsqueda principal por username (case-insensitive garantizado
-- por el CHECK que fuerza lowercase, pero lower() por si acaso)
CREATE UNIQUE INDEX idx_users_username
  ON public.users (lower(username));

-- Índice parcial: admin único.
-- Sustituto de un constraint complejo: no puede existir más de
-- un registro con is_admin = true en toda la tabla.
CREATE UNIQUE INDEX idx_single_admin
  ON public.users (is_admin)
  WHERE is_admin = true;

-- Presencia: consulta de usuarios activos ordenados por actividad reciente
CREATE INDEX idx_users_last_seen
  ON public.users (last_seen DESC NULLS LAST)
  WHERE is_active = true;

-- Estado activo: filtros frecuentes en el panel admin
CREATE INDEX idx_users_is_active
  ON public.users (is_active, created_at DESC);

-- Setup token: lookup durante activación de cuenta
-- Parcial: solo existen mientras el usuario no está activado
CREATE INDEX idx_users_setup_token
  ON public.users (setup_token)
  WHERE setup_token IS NOT NULL;


-- =============================================================
-- TRIGGER: updated_at automático
-- =============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- =============================================================
-- COMENTARIOS DE TABLA Y COLUMNAS
-- Visibles en Supabase Studio y herramientas de introspección
-- =============================================================

COMMENT ON TABLE  public.users IS 'Usuarios del sistema XCodec. Gestión exclusiva por administrador.';
COMMENT ON COLUMN public.users.id           IS 'PK UUID v4. Usado como payload de sesión en iron-session.';
COMMENT ON COLUMN public.users.username     IS 'Identificador de login. Lowercase. Único e inmutable.';
COMMENT ON COLUMN public.users.display_name IS 'Nombre visible en el chat. Definido por el admin.';
COMMENT ON COLUMN public.users.password_hash IS 'Hash bcrypt cost-12. NULL hasta activación. Nunca exponer.';
COMMENT ON COLUMN public.users.password_set  IS 'false = primer acceso pendiente. true = cuenta activa.';
COMMENT ON COLUMN public.users.setup_token   IS 'Token one-time para activación. Se borra al activar.';
COMMENT ON COLUMN public.users.setup_token_expires_at IS 'Expiración del setup_token. 7 días por defecto.';
COMMENT ON COLUMN public.users.is_admin      IS 'Administrador único. Índice parcial garantiza unicidad.';
COMMENT ON COLUMN public.users.is_active     IS 'false = desactivado. Middleware destruye sesión activa.';
COMMENT ON COLUMN public.users.last_seen     IS 'Actualizado cada 30s desde el cliente de chat.';
COMMENT ON COLUMN public.users.created_by    IS 'Admin que creó este usuario. NULL para el primer admin.';
