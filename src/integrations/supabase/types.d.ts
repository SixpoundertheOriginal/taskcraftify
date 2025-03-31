// Define a simplified Database type for our project, focusing on the tables and fields we actually use
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
      activities: {
        Row: {
          created_at: string;
          created_by: string;
          description: string;
          id: string;
          metadata: Json | null;
          task_id: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description: string;
          id?: string;
          metadata?: Json | null;
          task_id: string;
          type: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string;
          id?: string;
          metadata?: Json | null;
          task_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_groups: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          project_id: string | null;
          color: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          project_id?: string | null;
          color?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          project_id?: string | null;
          color?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED";
          priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
          due_date: string | null;
          tags: string[] | null;
          project_id: string | null;
          task_group_id: string | null;
          position: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED";
          priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
          due_date?: string | null;
          tags?: string[] | null;
          project_id?: string | null;
          task_group_id?: string | null;
          position?: number;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED";
          priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
          due_date?: string | null;
          tags?: string[] | null;
          project_id?: string | null;
          task_group_id?: string | null;
          position?: number;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_task_group_id_fkey"
            columns: ["task_group_id"]
            isOneToOne: false
            referencedRelation: "task_groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "calendar_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          task_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          task_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          task_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          id: string
          task_id: string
          content: string
          created_by: string
          created_at: string
          updated_at: string
          edited: boolean
        }
        Insert: {
          id?: string
          task_id: string
          content: string
          created_by: string
          created_at?: string
          updated_at?: string
          edited?: boolean
        }
        Update: {
          id?: string
          task_id?: string
          content?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          edited?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          id: string
          task_id: string
          type: string
          description: string
          created_at: string
          created_by: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          task_id: string
          type: string
          description: string
          created_at?: string
          created_by: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          task_id?: string
          type?: string
          description?: string
          created_at?: string
          created_by?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          original_name: string
          file_name: string
          file_size: number
          file_type: string
          storage_path: string
          thumbnail_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          original_name: string
          file_name: string
          file_size: number
          file_type: string
          storage_path: string
          thumbnail_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          original_name?: string
          file_name?: string
          file_size?: number
          file_type?: string
          storage_path?: string
          thumbnail_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      template_usage: {
        Row: {
          id: string
          task_id: string
          template_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          template_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          template_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_usage_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          structure: Json
          usage_count: number
          last_used: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          structure: Json
          usage_count?: number
          last_used?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          structure?: Json
          usage_count?: number
          last_used?: string | null
          created_at?: string
        }
        Relationships: []
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
      task_priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      task_status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED";
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}
