/**
 * Authentication Helper Functions
 */

import { supabase } from './supabase';
import type { UserProfile } from '../types/auth.types';

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    // First check if there's an active session (fast, local check)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;

    // Only query user_profiles if we have an active session
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return profile as UserProfile;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

/**
 * Check if user can access a specific website
 */
export async function canAccessWebsite(websiteId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    // Check via database function
    const { data, error } = await supabase
      .rpc('can_access_website', {
        p_user_id: user.id,
        p_website_id: websiteId
      });

    if (error) throw error;
    
    return data === true;
  } catch (error) {
    console.error('Error checking website access:', error);
    return false;
  }
}

/**
 * Get websites accessible to current user
 */
export async function getUserWebsites(): Promise<any[]> {
  try {
    const user = await getCurrentUser();
    
    if (!user) return [];

    // Admins get all websites
    if (user.role === 'admin') {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    // Editors get only their assigned websites
    const { data, error } = await supabase
      .from('website_editors')
      .select(`
        website:websites (*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) throw error;
    
    return data?.map((item: any) => item.website).filter(Boolean) || [];
  } catch (error) {
    console.error('Error getting user websites:', error);
    return [];
  }
}

/**
 * Sign in user
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Log activity
 */
export async function logActivity(
  websiteId: string,
  action: string,
  resource: string,
  resourceId?: string,
  oldValue?: any,
  newValue?: any
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase.rpc('log_activity', {
      p_website_id: websiteId,
      p_user_id: user.id,
      p_action: action,
      p_resource: resource,
      p_resource_id: resourceId || null,
      p_old_value: oldValue || null,
      p_new_value: newValue || null
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

