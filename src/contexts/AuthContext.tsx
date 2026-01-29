/**
 * Authentication Context
 * Manages user authentication state and permissions
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser, signIn as authSignIn, signOut as authSignOut, canAccessWebsite as checkWebsiteAccess } from '../lib/auth';
import type { AuthContextType, UserProfile } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session (fast check) - don't block render
    checkUser().catch(console.error);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await checkUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
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
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    await authSignIn(email, password);
    await checkUser();
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
    isAdmin: user?.role === 'admin',
    canAccessWebsite,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

