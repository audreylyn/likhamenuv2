/**
 * Supabase Database Types
 * Auto-generated type definitions for Supabase queries
 * 
 * This is a simplified version. For production, you should generate
 * types using: npx supabase gen types typescript --project-id PROJECT_ID
 */

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
      websites: {
        Row: {
          id: string
          subdomain: string
          site_title: string
          site_description: string | null
          logo_url: string | null
          favicon_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subdomain: string
          site_title: string
          site_description?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subdomain?: string
          site_title?: string
          site_description?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      hero_content: {
        Row: {
          id: string
          website_id: string
          slides: Json
          button_text: string
          button_link: string
          show_button: boolean
          autoplay: boolean
          autoplay_interval: number
          show_navigation: boolean
          show_indicators: boolean
          parallax_enabled: boolean
          created_at: string
          updated_at: string
        }
      }
      // Add more table definitions as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

