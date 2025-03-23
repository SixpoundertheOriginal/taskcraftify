
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
    }
  }
}
