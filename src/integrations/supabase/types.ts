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
      admin_permissions: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_super_admin: boolean
          perm_ai: boolean
          perm_audit_log: boolean
          perm_content: boolean
          perm_deals: boolean
          perm_developers: boolean
          perm_lands: boolean
          perm_owners: boolean
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_super_admin?: boolean
          perm_ai?: boolean
          perm_audit_log?: boolean
          perm_content?: boolean
          perm_deals?: boolean
          perm_developers?: boolean
          perm_lands?: boolean
          perm_owners?: boolean
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_super_admin?: boolean
          perm_ai?: boolean
          perm_audit_log?: boolean
          perm_content?: boolean
          perm_deals?: boolean
          perm_developers?: boolean
          perm_lands?: boolean
          perm_owners?: boolean
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      deal_documents: {
        Row: {
          created_at: string
          created_by: string
          deal_id: string
          document_source: string
          document_url: string
          id: string
          updated_at: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          deal_id: string
          document_source?: string
          document_url: string
          id?: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          deal_id?: string
          document_source?: string
          document_url?: string
          id?: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_logs: {
        Row: {
          action: string
          created_at: string
          deal_id: string
          details: string | null
          id: string
          performed_by: string
        }
        Insert: {
          action: string
          created_at?: string
          deal_id: string
          details?: string | null
          id?: string
          performed_by: string
        }
        Update: {
          action?: string
          created_at?: string
          deal_id?: string
          details?: string | null
          id?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_logs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_meetings: {
        Row: {
          created_at: string
          created_by: string
          deal_id: string
          duration_minutes: number
          id: string
          location: string | null
          meet_link: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          notes: string | null
          scheduled_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deal_id: string
          duration_minutes?: number
          id?: string
          location?: string | null
          meet_link?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          scheduled_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deal_id?: string
          duration_minutes?: number
          id?: string
          location?: string | null
          meet_link?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          scheduled_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_meetings_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_reports: {
        Row: {
          id: string
          deal_request_id: string
          meeting_id: string
          created_by: string
          version: number
          summary: string
          outcome: string
          action_items: Json
          responsibilities: Json
          deadlines: Json
          additional_requests: string | null
          next_steps: string | null
          status: string
          expires_at: string
          reminder_sent: boolean
          reminder_sent_at: string | null
          expired_processed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deal_request_id: string
          meeting_id: string
          created_by: string
          version?: number
          summary: string
          outcome: string
          action_items?: Json
          responsibilities?: Json
          deadlines?: Json
          additional_requests?: string | null
          next_steps?: string | null
          status?: string
          expires_at?: string
          reminder_sent?: boolean
          reminder_sent_at?: string | null
          expired_processed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deal_request_id?: string
          meeting_id?: string
          created_by?: string
          version?: number
          summary?: string
          outcome?: string
          action_items?: Json
          responsibilities?: Json
          deadlines?: Json
          additional_requests?: string | null
          next_steps?: string | null
          status?: string
          expires_at?: string
          reminder_sent?: boolean
          reminder_sent_at?: string | null
          expired_processed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_approvals: {
        Row: {
          id: string
          report_id: string
          user_id: string
          role: string
          decision: string
          notes: string | null
          decided_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          role: string
          decision: string
          notes?: string | null
          decided_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          role?: string
          decision?: string
          notes?: string | null
          decided_at?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          id: string
          event_type: string
          recipient_email: string
          recipient_user_id: string | null
          subject: string
          body_preview: string | null
          status: string
          attempts: number
          max_attempts: number
          last_attempt_at: string | null
          next_retry_at: string | null
          error: string | null
          related_entity_type: string | null
          related_entity_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          recipient_email: string
          recipient_user_id?: string | null
          subject: string
          body_preview?: string | null
          status?: string
          attempts?: number
          max_attempts?: number
          last_attempt_at?: string | null
          next_retry_at?: string | null
          error?: string | null
          related_entity_type?: string | null
          related_entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          recipient_email?: string
          recipient_user_id?: string | null
          subject?: string
          body_preview?: string | null
          status?: string
          attempts?: number
          max_attempts?: number
          last_attempt_at?: string | null
          next_retry_at?: string | null
          error?: string | null
          related_entity_type?: string | null
          related_entity_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      developer_reports: {
        Row: {
          id: string
          deal_request_id: string | null
          developer_id: string
          requested_by: string
          status: string
          report_data: Json | null
          cache_key: string
          error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deal_request_id?: string | null
          developer_id: string
          requested_by: string
          status?: string
          report_data?: Json | null
          cache_key: string
          error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deal_request_id?: string | null
          developer_id?: string
          requested_by?: string
          status?: string
          report_data?: Json | null
          cache_key?: string
          error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      negotiation_rounds: {
        Row: {
          id: string
          deal_request_id: string
          round_number: number
          initiated_by: string
          initiator_role: string
          offer_summary: string
          proposed_terms: Json
          attachments: Json | null
          response_decision: string | null
          response_notes: string | null
          responded_by: string | null
          responder_role: string | null
          responded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deal_request_id: string
          round_number: number
          initiated_by: string
          initiator_role: string
          offer_summary: string
          proposed_terms?: Json
          attachments?: Json | null
          response_decision?: string | null
          response_notes?: string | null
          responded_by?: string | null
          responder_role?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deal_request_id?: string
          round_number?: number
          initiated_by?: string
          initiator_role?: string
          offer_summary?: string
          proposed_terms?: Json
          attachments?: Json | null
          response_decision?: string | null
          response_notes?: string | null
          responded_by?: string | null
          responder_role?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      deal_closings: {
        Row: {
          id: string
          deal_request_id: string
          outcome: string
          commission_rate: number | null
          commission_type: string | null
          commission_reference: string | null
          commission_approved: boolean
          final_terms: Json
          approved_by: string | null
          approved_at: string | null
          closing_notes: string | null
          legal_notes: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deal_request_id: string
          outcome: string
          commission_rate?: number | null
          commission_type?: string | null
          commission_reference?: string | null
          commission_approved?: boolean
          final_terms?: Json
          approved_by?: string | null
          approved_at?: string | null
          closing_notes?: string | null
          legal_notes?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deal_request_id?: string
          outcome?: string
          commission_rate?: number | null
          commission_type?: string | null
          commission_reference?: string | null
          commission_approved?: boolean
          final_terms?: Json
          approved_by?: string | null
          approved_at?: string | null
          closing_notes?: string | null
          legal_notes?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      deal_studies: {
        Row: {
          id: string
          deal_request_id: string
          version: number
          uploaded_by: string
          title: string
          summary: string | null
          file_url: string
          notes: string | null
          status: string
          reviewer_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deal_request_id: string
          version?: number
          uploaded_by: string
          title: string
          summary?: string | null
          file_url: string
          notes?: string | null
          status?: string
          reviewer_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deal_request_id?: string
          version?: number
          uploaded_by?: string
          title?: string
          summary?: string | null
          file_url?: string
          notes?: string | null
          status?: string
          reviewer_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_studies_deal_request_id_fkey"
            columns: ["deal_request_id"]
            isOneToOne: false
            referencedRelation: "deal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_request_meetings: {
        Row: {
          id: string
          deal_request_id: string
          proposed_by: string
          proposed_date: string
          proposed_time: string
          duration_minutes: number
          timezone: string
          meeting_link: string | null
          room_id: string | null
          status: string
          confirmed_by: string | null
          confirmed_at: string | null
          reschedule_count: number
          reschedule_reason: string | null
          cancel_reason: string | null
          cancelled_by: string | null
          completed_at: string | null
          completed_by: string | null
          notes: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deal_request_id: string
          proposed_by: string
          proposed_date: string
          proposed_time: string
          duration_minutes?: number
          timezone?: string
          meeting_link?: string | null
          room_id?: string | null
          status?: string
          confirmed_by?: string | null
          confirmed_at?: string | null
          reschedule_count?: number
          reschedule_reason?: string | null
          cancel_reason?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          notes?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deal_request_id?: string
          proposed_by?: string
          proposed_date?: string
          proposed_time?: string
          duration_minutes?: number
          timezone?: string
          meeting_link?: string | null
          room_id?: string | null
          status?: string
          confirmed_by?: string | null
          confirmed_at?: string | null
          reschedule_count?: number
          reschedule_reason?: string | null
          cancel_reason?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          notes?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_request_meetings_deal_request_id_fkey"
            columns: ["deal_request_id"]
            isOneToOne: false
            referencedRelation: "deal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_reveal_log: {
        Row: {
          id: string
          deal_request_id: string
          viewer_user_id: string
          viewer_role: string
          revealed_party: string
          reveal_level: string
          fields_revealed: string[]
          trigger_event: string
          current_phase: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          deal_request_id: string
          viewer_user_id: string
          viewer_role: string
          revealed_party: string
          reveal_level: string
          fields_revealed?: string[]
          trigger_event: string
          current_phase: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          deal_request_id?: string
          viewer_user_id?: string
          viewer_role?: string
          revealed_party?: string
          reveal_level?: string
          fields_revealed?: string[]
          trigger_event?: string
          current_phase?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_reveal_log_deal_request_id_fkey"
            columns: ["deal_request_id"]
            isOneToOne: false
            referencedRelation: "deal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_phase_transitions: {
        Row: {
          id: string
          deal_request_id: string
          from_phase: string
          to_phase: string
          triggered_by: string
          actor_role: string
          reason: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          deal_request_id: string
          from_phase: string
          to_phase: string
          triggered_by: string
          actor_role: string
          reason?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          deal_request_id?: string
          from_phase?: string
          to_phase?: string
          triggered_by?: string
          actor_role?: string
          reason?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_phase_transitions_deal_request_id_fkey"
            columns: ["deal_request_id"]
            isOneToOne: false
            referencedRelation: "deal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_requests: {
        Row: {
          attachments_urls: string[] | null
          closed_at: string | null
          commission_accepted: boolean
          commission_rate: number
          created_at: string
          current_phase: string
          developer_id: string
          developer_nda_status: string
          estimated_duration_months: number | null
          id: string
          identity_reveal_level: string
          land_id: string
          needs_financing: boolean | null
          owner_nda_status: string
          owner_response_notes: string | null
          proposal_link: string | null
          proposal_summary: string
          proposed_project_type: string
          rejected_by: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          attachments_urls?: string[] | null
          closed_at?: string | null
          commission_accepted?: boolean
          commission_rate?: number
          created_at?: string
          current_phase?: string
          developer_id: string
          developer_nda_status?: string
          estimated_duration_months?: number | null
          id?: string
          identity_reveal_level?: string
          land_id: string
          needs_financing?: boolean | null
          owner_nda_status?: string
          owner_response_notes?: string | null
          proposal_link?: string | null
          proposal_summary: string
          proposed_project_type: string
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          attachments_urls?: string[] | null
          closed_at?: string | null
          commission_accepted?: boolean
          commission_rate?: number
          created_at?: string
          current_phase?: string
          developer_id?: string
          developer_nda_status?: string
          estimated_duration_months?: number | null
          id?: string
          identity_reveal_level?: string
          land_id?: string
          needs_financing?: boolean | null
          owner_nda_status?: string
          owner_response_notes?: string | null
          proposal_link?: string | null
          proposal_summary?: string
          proposed_project_type?: string
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_requests_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_requests_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_requests_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands_public"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stages_log: {
        Row: {
          changed_by: string
          created_at: string
          deal_id: string
          from_stage: Database["public"]["Enums"]["deal_stage"] | null
          id: string
          notes: string | null
          to_stage: Database["public"]["Enums"]["deal_stage"]
        }
        Insert: {
          changed_by: string
          created_at?: string
          deal_id: string
          from_stage?: Database["public"]["Enums"]["deal_stage"] | null
          id?: string
          notes?: string | null
          to_stage: Database["public"]["Enums"]["deal_stage"]
        }
        Update: {
          changed_by?: string
          created_at?: string
          deal_id?: string
          from_stage?: Database["public"]["Enums"]["deal_stage"] | null
          id?: string
          notes?: string | null
          to_stage?: Database["public"]["Enums"]["deal_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "deal_stages_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          deal_id: string
          description: string | null
          due_date: string | null
          id: string
          status: Database["public"]["Enums"]["deal_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          deal_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["deal_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["deal_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          closed_at: string | null
          commission_rate: number
          commission_status: string
          created_at: string
          current_stage: Database["public"]["Enums"]["deal_stage"]
          developer_acknowledgment_accepted: boolean | null
          developer_acknowledgment_date: string | null
          developer_id: string
          health: Database["public"]["Enums"]["deal_health"]
          id: string
          land_id: string
          owner_acknowledgment_accepted: boolean | null
          owner_acknowledgment_date: string | null
          owner_id: string
          request_id: string
          support_assignee: string | null
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          commission_rate?: number
          commission_status?: string
          created_at?: string
          current_stage?: Database["public"]["Enums"]["deal_stage"]
          developer_acknowledgment_accepted?: boolean | null
          developer_acknowledgment_date?: string | null
          developer_id: string
          health?: Database["public"]["Enums"]["deal_health"]
          id?: string
          land_id: string
          owner_acknowledgment_accepted?: boolean | null
          owner_acknowledgment_date?: string | null
          owner_id: string
          request_id: string
          support_assignee?: string | null
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          commission_rate?: number
          commission_status?: string
          created_at?: string
          current_stage?: Database["public"]["Enums"]["deal_stage"]
          developer_acknowledgment_accepted?: boolean | null
          developer_acknowledgment_date?: string | null
          developer_id?: string
          health?: Database["public"]["Enums"]["deal_health"]
          id?: string
          land_id?: string
          owner_acknowledgment_accepted?: boolean | null
          owner_acknowledgment_date?: string | null
          owner_id?: string
          request_id?: string
          support_assignee?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "deal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          city: string | null
          company_name: string
          company_profile_url: string | null
          contact_person_name: string | null
          cr_extracted_name: string | null
          cr_extracted_number: string | null
          cr_file_url: string
          cr_number: string
          created_at: string
          email: string | null
          id: string
          marketing_brand_name: string | null
          phone: string | null
          project_types: string[]
          target_cities: string[]
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["developer_verification_status"]
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          company_name: string
          company_profile_url?: string | null
          contact_person_name?: string | null
          cr_extracted_name?: string | null
          cr_extracted_number?: string | null
          cr_file_url: string
          cr_number: string
          created_at?: string
          email?: string | null
          id?: string
          marketing_brand_name?: string | null
          phone?: string | null
          project_types?: string[]
          target_cities?: string[]
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["developer_verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string
          company_profile_url?: string | null
          contact_person_name?: string | null
          cr_extracted_name?: string | null
          cr_extracted_number?: string | null
          cr_file_url?: string
          cr_number?: string
          created_at?: string
          email?: string | null
          id?: string
          marketing_brand_name?: string | null
          phone?: string | null
          project_types?: string[]
          target_cities?: string[]
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["developer_verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      land_pulse_snapshots: {
        Row: {
          ai_report_ar: string | null
          ai_report_en: string | null
          created_at: string
          id: string
          land_id: string
          pois_list: Json
          radius_m: number
          summary_json: Json
        }
        Insert: {
          ai_report_ar?: string | null
          ai_report_en?: string | null
          created_at?: string
          id?: string
          land_id: string
          pois_list?: Json
          radius_m?: number
          summary_json?: Json
        }
        Update: {
          ai_report_ar?: string | null
          ai_report_en?: string | null
          created_at?: string
          id?: string
          land_id?: string
          pois_list?: Json
          radius_m?: number
          summary_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "land_pulse_snapshots_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_pulse_snapshots_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands_public"
            referencedColumns: ["id"]
          },
        ]
      }
      brokerage_contracts: {
        Row: {
          id: string
          land_id: string
          owner_id: string
          contract_number: string
          contract_file_url: string | null
          contract_date: string | null
          contract_expiry: string | null
          commission_rate: number
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          land_id: string
          owner_id: string
          contract_number: string
          contract_file_url?: string | null
          contract_date?: string | null
          contract_expiry?: string | null
          commission_rate?: number
          status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          land_id?: string
          owner_id?: string
          contract_number?: string
          contract_file_url?: string | null
          contract_date?: string | null
          contract_expiry?: string | null
          commission_rate?: number
          status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brokerage_contracts_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
        ]
      }
      lands: {
        Row: {
          additional_docs_urls: string[] | null
          brokerage_license_date: string | null
          brokerage_license_expiry: string | null
          brokerage_license_number: string | null
          brokerage_license_status: string
          city: string
          contribution_model: string | null
          created_at: string
          deed_date: string | null
          deed_file_url: string | null
          deed_number: string | null
          developer_experience_requirements: string | null
          development_subtype: string | null
          district: string | null
          estimated_price_per_sqm: number | null
          estimated_total_value: number | null
          exact_location_lat: number | null
          exact_location_lng: number | null
          exit_percentage: number | null
          expected_dev_duration_months: number | null
          financing_preference: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          kroki_file_url: string | null
          land_area_sqm: number
          land_boundaries: string | null
          legal_acknowledgment_accepted: boolean | null
          legal_acknowledgment_date: string | null
          length_m: number | null
          owner_approved: boolean
          owner_id: string
          owner_name: string | null
          parcel_count: number | null
          partnership_goal: Database["public"]["Enums"]["owner_partnership_goal"]
          partnership_model: string | null
          plan_number: string | null
          platform_fee_acknowledged: boolean | null
          plot_number: string | null
          project_model: string | null
          project_type: string | null
          quality_level: string | null
          revenue_model: string | null
          street_info: string | null
          street_width_m: number | null
          submission_status: string | null
          tenant_id: string | null
          updated_at: string
          usage_type: Database["public"]["Enums"]["land_usage_type"]
          vision_summary: string | null
          width_m: number | null
        }
        Insert: {
          additional_docs_urls?: string[] | null
          brokerage_license_date?: string | null
          brokerage_license_expiry?: string | null
          brokerage_license_number?: string | null
          brokerage_license_status?: string
          city: string
          contribution_model?: string | null
          created_at?: string
          deed_date?: string | null
          deed_file_url?: string | null
          deed_number?: string | null
          developer_experience_requirements?: string | null
          development_subtype?: string | null
          district?: string | null
          estimated_price_per_sqm?: number | null
          estimated_total_value?: number | null
          exact_location_lat?: number | null
          exact_location_lng?: number | null
          exit_percentage?: number | null
          expected_dev_duration_months?: number | null
          financing_preference?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          kroki_file_url?: string | null
          land_area_sqm: number
          land_boundaries?: string | null
          legal_acknowledgment_accepted?: boolean | null
          legal_acknowledgment_date?: string | null
          length_m?: number | null
          owner_approved?: boolean
          owner_id: string
          owner_name?: string | null
          parcel_count?: number | null
          partnership_goal?: Database["public"]["Enums"]["owner_partnership_goal"]
          partnership_model?: string | null
          plan_number?: string | null
          platform_fee_acknowledged?: boolean | null
          plot_number?: string | null
          project_model?: string | null
          project_type?: string | null
          quality_level?: string | null
          revenue_model?: string | null
          street_info?: string | null
          street_width_m?: number | null
          submission_status?: string | null
          tenant_id?: string | null
          updated_at?: string
          usage_type?: Database["public"]["Enums"]["land_usage_type"]
          vision_summary?: string | null
          width_m?: number | null
        }
        Update: {
          additional_docs_urls?: string[] | null
          brokerage_license_date?: string | null
          brokerage_license_expiry?: string | null
          brokerage_license_number?: string | null
          brokerage_license_status?: string
          city?: string
          contribution_model?: string | null
          created_at?: string
          deed_date?: string | null
          deed_file_url?: string | null
          deed_number?: string | null
          developer_experience_requirements?: string | null
          development_subtype?: string | null
          district?: string | null
          estimated_price_per_sqm?: number | null
          estimated_total_value?: number | null
          exact_location_lat?: number | null
          exact_location_lng?: number | null
          exit_percentage?: number | null
          expected_dev_duration_months?: number | null
          financing_preference?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          kroki_file_url?: string | null
          land_area_sqm?: number
          land_boundaries?: string | null
          legal_acknowledgment_accepted?: boolean | null
          legal_acknowledgment_date?: string | null
          length_m?: number | null
          owner_approved?: boolean
          owner_id?: string
          owner_name?: string | null
          parcel_count?: number | null
          partnership_goal?: Database["public"]["Enums"]["owner_partnership_goal"]
          partnership_model?: string | null
          plan_number?: string | null
          platform_fee_acknowledged?: boolean | null
          plot_number?: string | null
          project_model?: string | null
          project_type?: string | null
          quality_level?: string | null
          revenue_model?: string | null
          street_info?: string | null
          street_width_m?: number | null
          submission_status?: string | null
          tenant_id?: string | null
          updated_at?: string
          usage_type?: Database["public"]["Enums"]["land_usage_type"]
          vision_summary?: string | null
          width_m?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lands_tenant_id_fkey"
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
      nda_consents: {
        Row: {
          id: string
          user_id: string
          land_id: string
          actor_role: string
          nda_version: string
          nda_text_ar: string
          nda_text_en: string
          status: string
          accepted_at: string | null
          rejected_at: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          land_id: string
          actor_role?: string
          nda_version?: string
          nda_text_ar: string
          nda_text_en: string
          status?: string
          accepted_at?: string | null
          rejected_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          land_id?: string
          actor_role?: string
          nda_version?: string
          nda_text_ar?: string
          nda_text_en?: string
          status?: string
          accepted_at?: string | null
          rejected_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nda_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nda_consents_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
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
      platform_content: {
        Row: {
          body_ar: string
          body_en: string
          content_key: string
          content_type: string
          created_at: string
          id: string
          is_active: boolean
          title_ar: string
          title_en: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_ar?: string
          body_en?: string
          content_key: string
          content_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title_ar?: string
          title_en?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_ar?: string
          body_en?: string
          content_key?: string
          content_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title_ar?: string
          title_en?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_offers: {
        Row: {
          id: string
          slug: string
          type: string
          city_ar: string
          city_en: string
          district_ar: string
          district_en: string
          usage_type: string
          area_sqm: number
          title_ar: string
          title_en: string
          description_ar: string
          description_en: string
          detailed_description_ar: string
          detailed_description_en: string
          image_url: string
          features_ar: string[]
          features_en: string[]
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          type: string
          city_ar: string
          city_en: string
          district_ar?: string
          district_en?: string
          usage_type: string
          area_sqm: number
          title_ar: string
          title_en: string
          description_ar?: string
          description_en?: string
          detailed_description_ar?: string
          detailed_description_en?: string
          image_url?: string
          features_ar?: string[]
          features_en?: string[]
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          type?: string
          city_ar?: string
          city_en?: string
          district_ar?: string
          district_en?: string
          usage_type?: string
          area_sqm?: number
          title_ar?: string
          title_en?: string
          description_ar?: string
          description_en?: string
          detailed_description_ar?: string
          detailed_description_en?: string
          image_url?: string
          features_ar?: string[]
          features_en?: string[]
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
      target_companies: {
        Row: {
          added_by: string
          ai_analysis: string | null
          ai_strength_score: number | null
          company_name: string
          contact_person_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          image_url: string | null
          is_registered: boolean
          lead_status: string
          notes: string | null
          project_count: number | null
          registered_developer_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          added_by: string
          ai_analysis?: string | null
          ai_strength_score?: number | null
          company_name: string
          contact_person_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_registered?: boolean
          lead_status?: string
          notes?: string | null
          project_count?: number | null
          registered_developer_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          added_by?: string
          ai_analysis?: string | null
          ai_strength_score?: number | null
          company_name?: string
          contact_person_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_registered?: boolean
          lead_status?: string
          notes?: string | null
          project_count?: number | null
          registered_developer_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "target_companies_registered_developer_id_fkey"
            columns: ["registered_developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
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
      lands_public: {
        Row: {
          city: string | null
          created_at: string | null
          developer_experience_requirements: string | null
          district: string | null
          expected_dev_duration_months: number | null
          financing_preference: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          land_area_sqm: number | null
          length_m: number | null
          partnership_goal:
            | Database["public"]["Enums"]["owner_partnership_goal"]
            | null
          partnership_model: string | null
          project_type: string | null
          quality_level: string | null
          revenue_model: string | null
          street_width_m: number | null
          updated_at: string | null
          usage_type: Database["public"]["Enums"]["land_usage_type"] | null
          vision_summary: string | null
          width_m: number | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          developer_experience_requirements?: string | null
          district?: string | null
          expected_dev_duration_months?: number | null
          financing_preference?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          land_area_sqm?: number | null
          length_m?: number | null
          partnership_goal?:
            | Database["public"]["Enums"]["owner_partnership_goal"]
            | null
          partnership_model?: string | null
          project_type?: string | null
          quality_level?: string | null
          revenue_model?: string | null
          street_width_m?: number | null
          updated_at?: string | null
          usage_type?: Database["public"]["Enums"]["land_usage_type"] | null
          vision_summary?: string | null
          width_m?: number | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          developer_experience_requirements?: string | null
          district?: string | null
          expected_dev_duration_months?: number | null
          financing_preference?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          land_area_sqm?: number | null
          length_m?: number | null
          partnership_goal?:
            | Database["public"]["Enums"]["owner_partnership_goal"]
            | null
          partnership_model?: string | null
          project_type?: string | null
          quality_level?: string | null
          revenue_model?: string | null
          street_width_m?: number | null
          updated_at?: string | null
          usage_type?: Database["public"]["Enums"]["land_usage_type"] | null
          vision_summary?: string | null
          width_m?: number | null
        }
        Relationships: []
      }
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
      app_role: "admin" | "user" | "viewer" | "owner"
      deal_health: "green" | "yellow" | "red"
      deal_stage:
        | "listed"
        | "request_submitted"
        | "owner_review"
        | "owner_approved"
        | "meeting_scheduled"
        | "strategy_defined"
        | "documents_exchanged"
        | "agreements_prepared"
        | "deal_closed"
        | "deal_cancelled"
        | "accepting_proposals"
        | "under_review"
        | "agreed"
        | "active_project"
      deal_task_status: "pending" | "in_progress" | "done"
      developer_verification_status: "pending_review" | "verified" | "rejected"
      land_usage_type:
        | "residential"
        | "commercial"
        | "residential_commercial"
        | "high_density"
      lease_status: "active" | "expired" | "expiring_soon"
      meeting_type: "google_meet" | "in_person"
      owner_partnership_goal:
        | "develop_sell"
        | "develop_rent"
        | "develop_mixed"
        | "develop_complex"
        | "sell_develop"
        | "partial_exit"
        | "offplan_sell"
        | "real_estate_contribution"
      project_status: "under_construction" | "ready"
      property_type: "residential" | "commercial" | "under_construction"
      receivable_status: "pending" | "paid" | "overdue" | "partial"
      request_status: "pending" | "approved" | "rejected" | "info_requested"
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
      app_role: ["admin", "user", "viewer", "owner"],
      deal_health: ["green", "yellow", "red"],
      deal_stage: [
        "listed",
        "request_submitted",
        "owner_review",
        "owner_approved",
        "meeting_scheduled",
        "strategy_defined",
        "documents_exchanged",
        "agreements_prepared",
        "deal_closed",
        "deal_cancelled",
        "accepting_proposals",
        "under_review",
        "agreed",
        "active_project",
      ],
      deal_task_status: ["pending", "in_progress", "done"],
      developer_verification_status: ["pending_review", "verified", "rejected"],
      land_usage_type: [
        "residential",
        "commercial",
        "residential_commercial",
        "high_density",
      ],
      lease_status: ["active", "expired", "expiring_soon"],
      meeting_type: ["google_meet", "in_person"],
      owner_partnership_goal: [
        "develop_sell",
        "develop_rent",
        "develop_mixed",
        "develop_complex",
        "sell_develop",
        "partial_exit",
        "offplan_sell",
        "real_estate_contribution",
      ],
      project_status: ["under_construction", "ready"],
      property_type: ["residential", "commercial", "under_construction"],
      receivable_status: ["pending", "paid", "overdue", "partial"],
      request_status: ["pending", "approved", "rejected", "info_requested"],
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
