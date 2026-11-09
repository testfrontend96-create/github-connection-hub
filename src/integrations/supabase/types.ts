export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor: string | null
          actor_email: string | null
          before: Json | null
          created_at: string
          id: string
          kind: string | null
          slug: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          actor_email?: string | null
          before?: Json | null
          created_at?: string
          id?: string
          kind?: string | null
          slug?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          actor_email?: string | null
          before?: Json | null
          created_at?: string
          id?: string
          kind?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      admin_emails: {
        Row: {
          added_by: string | null
          email: string
          enabled: boolean
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          email: string
          enabled?: boolean
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          email?: string
          enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      admin_requests: {
        Row: {
          created_at: string
          email: string
          name: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          name?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          name?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          data: Json
          deleted: boolean
          kind: string
          slug: string
          sort: number | null
          updated_at: string
          updated_by: string | null
          visible: boolean
        }
        Insert: {
          data?: Json
          deleted?: boolean
          kind: string
          slug: string
          sort?: number | null
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Update: {
          data?: Json
          deleted?: boolean
          kind?: string
          slug?: string
          sort?: number | null
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Relationships: []
      }
      home_features: {
        Row: {
          item_kind: string | null
          item_slug: string | null
          mode: string
          slot: string
          updated_at: string
        }
        Insert: {
          item_kind?: string | null
          item_slug?: string | null
          mode?: string
          slot: string
          updated_at?: string
        }
        Update: {
          item_kind?: string | null
          item_slug?: string | null
          mode?: string
          slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          id: number
          kind: string
          slug: string
          viewed_at: string
        }
        Insert: {
          id?: number
          kind: string
          slug: string
          viewed_at?: string
        }
        Update: {
          id?: number
          kind?: string
          slug?: string
          viewed_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      submissions: {
        Row: {
          created_at: string
          data: Json
          done: boolean
          id: string
          kind: string
        }
        Insert: {
          created_at?: string
          data: Json
          done?: boolean
          id?: string
          kind: string
        }
        Update: {
          created_at?: string
          data?: Json
          done?: boolean
          id?: string
          kind?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decline_admin_request: {
        Args: { target_user: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      list_admins: {
        Args: never
        Returns: {
          avatar: string
          email: string
          has_access: boolean
          last_sign_in_at: string
          name: string
          source: string
        }[]
      }
      popular_items: {
        Args: { _kind: string; _limit?: number }
        Returns: {
          slug: string
          views: number
        }[]
      }
      request_admin_access: { Args: never; Returns: undefined }
      set_admin_email_access: {
        Args: { allow_access: boolean; target_email: string }
        Returns: undefined
      }
      sync_admin_role: { Args: { _uid: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
