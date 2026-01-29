/**
 * Authentication & Authorization Types
 */

export type UserRole = 'admin' | 'editor';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebsiteEditor {
  id: string;
  website_id: string;
  user_id: string;
  invited_by: string | null;
  invited_at: string;
  last_accessed: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  website_id: string;
  user_id: string | null;
  action: 'create' | 'update' | 'delete' | 'publish';
  resource: string;
  resource_id: string | null;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  display_name: string;
  colors: {
    primary: string;
    accent: string;
    cream: string;
    dark: string;
    light: string;
    text: string;
  };
  description: string | null;
  preview_image: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  canAccessWebsite: (websiteId: string) => Promise<boolean>;
}

export interface WebsiteContextType {
  currentWebsite: string | null; // website_id
  websiteData: any | null; // Full website data
  setCurrentWebsite: (websiteId: string) => void;
  loading: boolean;
  sectionVisibility: Record<string, boolean>; // Map of section_name -> is_enabled
  refreshContent: () => void; // Trigger components to refetch data
  contentVersion: number; // Version number that increments on refresh
}

