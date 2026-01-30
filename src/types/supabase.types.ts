/**
 * Supabase Database Types
 * Auto-generated type definitions for Supabase queries
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      websites: {
        Row: {
          id: string;
          owner: string | null;
          subdomain: string;
          title: string | null;
          logo: string | null;
          favicon: string | null;
          titlefont: string | null;
          status: string | null;
          createdat: string | null;
          updatedat: string | null;
          theme: Json;
          messenger: Json;
          contactformconfig: Json;
          enabledsections: Json;
          content: Json;
          marketing: Json;
          assignededitors: Json;
        };
        Insert: {
          id: string;
          owner?: string | null;
          subdomain: string;
          title?: string | null;
          logo?: string | null;
          favicon?: string | null;
          titlefont?: string | null;
          status?: string | null;
          createdat?: string | null;
          updatedat?: string | null;
          theme?: Json;
          messenger?: Json;
          contactformconfig?: Json;
          enabledsections?: Json;
          content?: Json;
          marketing?: Json;
          assignededitors?: Json;
        };
        Update: {
          id?: string;
          owner?: string | null;
          subdomain?: string;
          title?: string | null;
          logo?: string | null;
          favicon?: string | null;
          titlefont?: string | null;
          status?: string | null;
          createdat?: string | null;
          updatedat?: string | null;
          theme?: Json;
          messenger?: Json;
          contactformconfig?: Json;
          enabledsections?: Json;
          content?: Json;
          marketing?: Json;
          assignededitors?: Json;
        };
      };
      editors: {
        Row: {
          email: string;
          created_at: string;
        };
        Insert: {
          email: string;
          created_at?: string;
        };
        Update: {
          email?: string;
          created_at?: string;
        };
      };
      contact_submissions: {
        Row: {
          id: string;
          website_id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string | null;
          message: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          website_id: string;
          name: string;
          email: string;
          phone?: string | null;
          subject?: string | null;
          message: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          website_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          subject?: string | null;
          message?: string;
          status?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
