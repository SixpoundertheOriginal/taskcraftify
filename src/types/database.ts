export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED'
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          due_date: string | null
          created_at: string
          updated_at: string
          tags: string[] | null
          project_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          description?: string | null
          status?: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          due_date?: string | null
          created_at?: string
          updated_at?: string
          tags?: string[] | null
          project_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          due_date?: string | null
          created_at?: string
          updated_at?: string
          tags?: string[] | null
          project_id?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          user_id: string
          provider: string
          provider_user_id: string | null
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          scopes: string[] | null
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          provider_user_id?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          scopes?: string[] | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          provider_user_id?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          scopes?: string[] | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          integration_id: string | null
          external_event_id: string | null
          task_id: string | null
          title: string
          description: string | null
          start_time: string | null
          end_time: string | null
          all_day: boolean | null
          location: string | null
          status: string | null
          calendar_id: string | null
          recurrence: string[] | null
          last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          integration_id?: string | null
          external_event_id?: string | null
          task_id?: string | null
          title: string
          description?: string | null
          start_time?: string | null
          end_time?: string | null
          all_day?: boolean | null
          location?: string | null
          status?: string | null
          calendar_id?: string | null
          recurrence?: string[] | null
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          integration_id?: string | null
          external_event_id?: string | null
          task_id?: string | null
          title?: string
          description?: string | null
          start_time?: string | null
          end_time?: string | null
          all_day?: boolean | null
          location?: string | null
          status?: string | null
          calendar_id?: string | null
          recurrence?: string[] | null
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_settings: {
        Row: {
          id: string
          user_id: string
          email_address: string | null
          forward_address: string | null
          notification_preferences: Json | null
          daily_summary: boolean | null
          summary_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_address?: string | null
          forward_address?: string | null
          notification_preferences?: Json | null
          daily_summary?: boolean | null
          summary_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_address?: string | null
          forward_address?: string | null
          notification_preferences?: Json | null
          daily_summary?: boolean | null
          summary_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          created_at: string
          updated_at: string
          user_id: string
          parent_project_id: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          created_at?: string
          updated_at?: string
          user_id: string
          parent_project_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          parent_project_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_template_usage: {
        Args: {
          template_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      task_priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      task_status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
