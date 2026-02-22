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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          tenant_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          tenant_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          tenant_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          created_at: string
          duration_months: number | null
          ejar_number: string | null
          end_date: string
          id: string
          monthly_rent: number | null
          notes: string | null
          responsible_employee: string | null
          start_date: string
          status: Database["public"]["Enums"]["lease_status"]
          tenant_id: string | null
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_months?: number | null
          ejar_number?: string | null
          end_date: string
          id?: string
          monthly_rent?: number | null
          notes?: string | null
          responsible_employee?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id?: string | null
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_months?: number | null
          ejar_number?: string | null
          end_date?: string
          id?: string
          monthly_rent?: number | null
          notes?: string | null
          responsible_employee?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id?: string | null
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          tenant_id: string
          title: string
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          tenant_id: string
          title: string
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          tenant_id?: string
          title?: string
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message_ar: string
          message_en: string
          tenant_id: string | null
          title_ar: string
          title_en: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message_ar: string
          message_en: string
          tenant_id?: string | null
          title_ar: string
          title_en: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message_ar?: string
          message_en?: string
          tenant_id?: string | null
          title_ar?: string
          title_en?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_consents: {
        Row: {
          accepted_at: string
          id: string
          policy_type: string
          policy_version: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          policy_type: string
          policy_version?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          policy_type?: string
          policy_version?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          apartment_count: number | null
          city: string
          created_at: string
          district: string | null
          expected_end_date: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          office_count: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          shop_count: number | null
          showroom_count: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          street: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apartment_count?: number | null
          city: string
          created_at?: string
          district?: string | null
          expected_end_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          office_count?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          shop_count?: number | null
          showroom_count?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          street?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apartment_count?: number | null
          city?: string
          created_at?: string
          district?: string | null
          expected_end_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          office_count?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          shop_count?: number | null
          showroom_count?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          street?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      receivables: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          lease_id: string
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          status: Database["public"]["Enums"]["receivable_status"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          lease_id: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["receivable_status"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          lease_id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["receivable_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          city: string | null
          created_at: string
          currency: string
          id: string
          language: string
          name: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          currency?: string
          id?: string
          language?: string
          name: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          currency?: string
          id?: string
          language?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          area_sqm: number | null
          commission_percentage: number | null
          created_at: string
          id: string
          listing_duration_months: number | null
          listing_price: number | null
          project_id: string
          status: Database["public"]["Enums"]["unit_status"]
          tenant_id: string | null
          transfer_tax_percentage: number | null
          unit_number: string | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          area_sqm?: number | null
          commission_percentage?: number | null
          created_at?: string
          id?: string
          listing_duration_months?: number | null
          listing_price?: number | null
          project_id: string
          status?: Database["public"]["Enums"]["unit_status"]
          tenant_id?: string | null
          transfer_tax_percentage?: number | null
          unit_number?: string | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          area_sqm?: number | null
          commission_percentage?: number | null
          created_at?: string
          id?: string
          listing_duration_months?: number | null
          listing_price?: number | null
          project_id?: string
          status?: Database["public"]["Enums"]["unit_status"]
          tenant_id?: string | null
          transfer_tax_percentage?: number | null
          unit_number?: string | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["tenant_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "viewer"
      lease_status: "active" | "expired" | "expiring_soon"
      project_status: "under_construction" | "ready"
      property_type: "residential" | "commercial" | "under_construction"
      receivable_status: "pending" | "paid" | "overdue" | "partial"
      subscription_type:
        | "individual"
        | "brokerage"
        | "brand"
        | "property_management"
        | "bank"
      tenant_role: "owner" | "manager" | "staff" | "viewer"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      unit_status: "vacant" | "occupied" | "reserved" | "maintenance"
      unit_type: "showroom" | "shop" | "office" | "apartment"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user", "viewer"],
      lease_status: ["active", "expired", "expiring_soon"],
      project_status: ["under_construction", "ready"],
      property_type: ["residential", "commercial", "under_construction"],
      receivable_status: ["pending", "paid", "overdue", "partial"],
      subscription_type: [
        "individual",
        "brokerage",
        "brand",
        "property_management",
        "bank",
      ],
      tenant_role: ["owner", "manager", "staff", "viewer"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      unit_status: ["vacant", "occupied", "reserved", "maintenance"],
      unit_type: ["showroom", "shop", "office", "apartment"],
    },
  },
} as const
