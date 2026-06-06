// =============================================================
// Tipos de base de datos — XCodec
// Generado manualmente para coincidir con las migraciones SQL.
//
// En un proyecto con Supabase CLI configurado, sustituir con:
//   npx supabase gen types typescript --local > src/types/database.types.ts
// =============================================================

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id:                      string        // UUID
          username:                string
          display_name:            string
          password_hash:           string | null // NULL hasta activación
          password_set:            boolean
          setup_token:             string | null
          setup_token_expires_at:  string | null // TIMESTAMPTZ como ISO string
          is_admin:                boolean
          is_active:               boolean
          last_seen:               string | null
          created_by:              string | null // UUID del admin creador
          created_at:              string
          updated_at:              string
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
          updated_at?:             string
        }
      }
      messages: {
        Row: {
          id:         string  // UUID
          sender_id:  string  // UUID → users.id
          content:    string
          is_deleted: boolean
          created_at: string
        }
        Insert: {
          id?:        string
          sender_id:  string
          content:    string
          is_deleted?: boolean
          created_at?: string
        }
        Update: {
          is_deleted?: boolean
          // content no se edita en MVP
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      expire_setup_tokens: {
        Args:    Record<string, never>
        Returns: number
      }
      update_last_seen: {
        Args:    { p_user_id: string }
        Returns: void
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
    }
    Enums: Record<string, never>
  }
}

// =============================================================
// Tipos de dominio derivados del esquema
// Usados en componentes, hooks y Server Actions
// =============================================================

export type DbUser = Database['public']['Tables']['users']['Row']
export type DbMessage = Database['public']['Tables']['messages']['Row']
export type MessagePage = Database['public']['Functions']['get_messages_page']['Returns'][number]
