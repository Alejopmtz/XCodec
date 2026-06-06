# XCodec — Base de Datos

## Orden de ejecución en Supabase

```
migrations/
  20240601000001_create_users.sql     ← Tabla users + constraints + índices + trigger
  20240601000002_create_messages.sql  ← Tabla messages + Realtime
  20240601000003_functions.sql        ← Funciones SQL de utilidad
seed.sql                              ← Admin inicial (ejecutar después de migraciones)
```

## Comandos

### Desarrollo local
```bash
npx supabase start          # levanta Postgres + Studio local
npx supabase db reset       # aplica migraciones + seed (borra todo primero)
npx supabase db push        # aplica solo migraciones pendientes
```

### Producción (Supabase cloud)
```bash
npx supabase link --project-ref <ref>   # vincular proyecto cloud
npx supabase db push                    # subir migraciones
# Luego ejecutar seed.sql manualmente en el SQL Editor del Dashboard
```

### Generar tipos TypeScript
```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```

## Primer deploy — activar admin

1. Ejecutar migraciones + seed
2. Ir a `http://localhost:3000/setup`
3. Username: `admin`
4. Código: `XCADMIN1` (definido en seed.sql)
5. Crear contraseña
6. El sistema redirige a `/chat`

**⚠ Cambiar el setup_token del seed antes de producción**

## Diagrama de tablas

```
users
├── id (PK UUID)
├── username (UNIQUE lowercase 2-30 chars)
├── display_name (2-60 chars)
├── password_hash (bcrypt $2b$12$... | NULL)
├── password_set (false=primer acceso, true=activo)
├── setup_token (one-time | NULL tras activar)
├── setup_token_expires_at (7 días | NULL tras activar)
├── is_admin (UNIQUE partial: solo 1 admin)
├── is_active (false=desactivado)
├── last_seen (actualizado cada 30s en chat)
├── created_by (FK → users.id | NULL para admin inicial)
├── created_at
└── updated_at (trigger automático)

messages
├── id (PK UUID)
├── sender_id (FK → users.id CASCADE)
├── content (TEXT 1-2000 chars, trim no vacío)
├── is_deleted (soft delete por admin)
└── created_at (cursor de paginación)
```

## Funciones disponibles

| Función | Descripción |
|---|---|
| `expire_setup_tokens()` | Limpia tokens vencidos. Retorna filas afectadas. |
| `update_last_seen(uuid)` | Actualiza presencia del usuario. |
| `get_messages_page(cursor, limit)` | Historial paginado con datos del sender. |
| `regenerate_setup_token(uuid)` | Admin regenera token expirado. Retorna nuevo token. |
