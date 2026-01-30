/**
 * Authentication Context
 * Manages user authentication state and permissions
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  getCurrentUser,
  signIn as authSignIn,
  signOut as authSignOut,
  canAccessWebsite as checkWebsiteAccess,
} from "../lib/auth";
import type { AuthContextType, UserProfile } from "../types/auth.types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false); // Start as false - don't block render

  useEffect(() => {
    // Non-blocking session check
    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        checkUser();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const profile = await getCurrentUser();
      setUser(profile);
    } catch (error) {
      console.error("Error checking user:", error);
      setUser(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const data = await authSignIn(email, password);

    // Immediately set user state for faster UI update
    if (data.user) {
      const profile = {
        id: data.user.id,
        email: data.user.email || "",
        full_name: data.user.user_metadata?.full_name || null,
        avatar_url: data.user.user_metadata?.avatar_url || null,
        role: data.user.user_metadata?.role || "editor",
        is_active: true,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      };
      setUser(profile);
    }
  };

  const signOut = async () => {
    await authSignOut();
    setUser(null);
  };

  const canAccessWebsite = async (websiteId: string): Promise<boolean> => {
    if (!user) return false;
    return await checkWebsiteAccess(websiteId);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin: user?.role === "admin",
    canAccessWebsite,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
