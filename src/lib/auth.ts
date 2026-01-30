/**
 * Authentication Helper Functions
 * Uses Supabase Auth with user metadata for role management
 * and assignededitors JSONB in websites table for access control
 */

import { supabase } from "./supabase";
import type { UserProfile } from "../types/auth.types";

/**
 * Get current user profile from Supabase Auth
 * Role is stored in user_metadata
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return null;

    const user = session.user;

    // Build profile from auth user data
    const profile: UserProfile = {
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      role: user.user_metadata?.role || "editor",
      is_active: true,
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
    };

    return profile;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

/**
 * Check if user can access a specific website
 * Uses owner field and assignededitors JSONB array
 */
export async function canAccessWebsite(websiteId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    // Check if user is admin (from metadata)
    if (user.user_metadata?.role === "admin") return true;

    // Check if user is owner or assigned editor
    const { data, error } = await supabase
      .from("websites")
      .select("owner, assignededitors")
      .eq("id", websiteId)
      .single();

    if (error) {
      console.error("Error checking website access:", error);
      return false;
    }

    if (!data) return false;

    // Cast to expected type since Supabase types might be inferred strictly
    const website = data as { owner: string; assignededitors: any };

    // Check if owner
    if (website.owner === user.id) return true;

    // Check if in assignededitors array (by email)
    const assignedEditors = (website.assignededitors as string[]) || [];
    if (user.email && assignedEditors.includes(user.email)) return true;

    return false;
  } catch (error) {
    console.error("Error checking website access:", error);
    return false;
  }
}

/**
 * Get websites accessible to current user
 */
export async function getUserWebsites(): Promise<any[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    // Admins get all websites
    if (user.user_metadata?.role === "admin") {
      const { data, error } = await supabase
        .from("websites")
        .select("*")
        .order("createdat", { ascending: false });

      if (error) throw error;
      return data || [];
    }

    // For non-admins, get websites where they are owner or assigned editor
    // RLS policies handle this automatically
    const { data, error } = await supabase
      .from("websites")
      .select("*")
      .order("createdat", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting user websites:", error);
    return [];
  }
}

/**
 * Sign in user
 * Returns user data immediately for faster UI update
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  // Return the user data so caller can update state immediately
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
 * Log activity (simplified - logs to console since we don't have activity_log table)
 */
export async function logActivity(
  websiteId: string,
  action: string,
  resource: string,
  resourceId?: string,
  oldValue?: any,
  newValue?: any,
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Log to console since we don't have an activity_log table
    console.log(`[Activity] ${action} on ${resource}`, {
      websiteId,
      userId: user.id,
      resourceId,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
