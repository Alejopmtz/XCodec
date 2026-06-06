// =============================================================
// Tipos de base de datos — XCodec
//
// Estructura exacta que @supabase/supabase-js v2.x requiere
// para resolver correctamente los genéricos de:
//   - PostgrestQueryBuilder (.select, .insert, .update, .upsert)
//   - PostgrestFilterBuilder (.eq, .single, .maybeSingle, .returns)
//   - PostgrestRpcBuilder (.rpc)
//
// CAUSA RAÍZ DE ERRORES PREVIOS:
//   La ausencia del campo `Relationships` en cada tabla hace que
//   TypeScript no pueda satisfacer la constraint GenericTable
//   interna de la librería. El compilador propaga `never` como
//   tipo de los parámetros de .update()/.insert()/.select(),
//   produciendo: "Argument of type '...' is not assignable to 'never'"
//
// FORMA ESPERADA POR @supabase/supabase-js@^2.x:
//   Tables[name]: { Row; Insert; Update; Relationships }
//   Views:         { [_ in never]: never }
//   Functions[name]: { Args; Returns }
//   Enums:         { [_ in never]: never }
//   CompositeTypes: { [_ in never]: never }
// =============================================================

export type Database = {
  public: {
    Tables: {

      // ── users ──────────────────────────────────────────────────
      users: {
        Row: {
          id:                     string        // UUID v4
          username:               string        // lowercase 2-30 chars
          display_name:           string        // 2-60 chars
          password_hash:          string | null // bcrypt $2b$12$... | NULL hasta activación
          password_set:           boolean       // false = primer acceso pendiente
          setup_token:            string | null // one-time 8-char hex | NULL tras activar
          setup_token_expires_at: string | null // TIMESTAMPTZ ISO | NULL tras activar
          is_admin:               boolean       // único admin del sistema
          is_active:              boolean       // false = desactivado por admin
          last_seen:              string | null // TIMESTAMPTZ ISO | NULL si nunca en chat
          created_by:             string | null // UUID del admin creador | NULL para admin inicial
          created_at:             string        // TIMESTAMPTZ ISO, inmutable
          updated_at:             string        // TIMESTAMPTZ ISO, trigger automático
        }
        Insert: {
          id?:                     string
          username:                string
          display_name:            string
          password_hash?:          string | null
          password_set?:           boolean
          setup_token?:            string | null
          setup_token_expires_at?: string | null
          is_admin?:               boolean
          is_active?:              boolean
          last_seen?:              string | null
          created_by?:             string | null
          created_at?:             string
          updated_at?:             string
        }
        Update: {
          id?:                     string
          username?:               string
          display_name?:           string
          password_hash?:          string | null
          password_set?:           boolean
          setup_token?:            string | null
          setup_token_expires_at?: string | null
          is_admin?:               boolean
          is_active?:              boolean
          last_seen?:              string | null
          created_by?:             string | null
          created_at?:             string
          updated_at?:             string
        }
        // Relationships es REQUERIDO por @supabase/supabase-js v2.
        // Sin este campo la constraint GenericTable falla y TODOS los
        // métodos del builder (.update, .insert, .select) colapsan a never.
        Relationships: [
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      // ── messages ───────────────────────────────────────────────
      messages: {
        Row: {
          id:         string  // UUID v4, cursor de paginación
          sender_id:  string  // UUID → users.id (CASCADE)
          content:    string  // TEXT 1-2000 chars
          is_deleted: boolean // soft delete por admin
          created_at: string  // TIMESTAMPTZ ISO, inmutable
        }
        Insert: {
          id?:         string
          sender_id:   string
          content:     string
          is_deleted?: boolean
          created_at?: string
        }
        Update: {
          id?:         string
          sender_id?:  string
          content?:    string
          is_deleted?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }

    // Views: sin vistas en XCodec.
    // Forma correcta para Supabase JS v2: mapped type sobre never,
    // NO Record<string, never> (que produce inconsistencias de inferencia).
    Views: {
      [_ in never]: never
    }

    // Functions: RPCs disponibles para el cliente.
    // Returns: undefined para funciones VOID (NO usar void — Supabase CLI
    // genera undefined y la librería espera ese tipo exacto).
    Functions: {
      expire_setup_tokens: {
        Args:    Record<PropertyKey, never>
        Returns: number
      }
      get_messages_page: {
        Args:    { p_cursor?: string | null; p_limit?: number }
        Returns: Array<{
          id:                  string
          content:             string
          is_deleted:          boolean
          created_at:          string
          sender_id:           string
          sender_username:     string
          sender_display_name: string
        }>
      }
      regenerate_setup_token: {
        Args:    { p_user_id: string }
        Returns: string
      }
      update_last_seen: {
        Args:    { p_user_id: string }
        Returns: undefined
      }
    }

    // Enums y CompositeTypes: sin definiciones en XCodec.
    // Misma forma correcta: mapped type sobre never.
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =============================================================
// Tipos de dominio derivados del esquema
// =============================================================

export type DbUser    = Database['public']['Tables']['users']['Row']
export type DbMessage = Database['public']['Tables']['messages']['Row']

// Tipo de retorno del RPC get_messages_page — usado como MessageWithSender
export type MessagePage =
  Database['public']['Functions']['get_messages_page']['Returns'][number]
