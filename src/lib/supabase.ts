/**
 * Supabase Client Configuration
 * LikhaSiteWorks - Database connection setup
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase.types';

// Supabase connection details
const SUPABASE_URL = 'https://pijhvlrjgsykqtgvcpaq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpamh2bHJqZ3N5a3F0Z3ZjcGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTgzNjYsImV4cCI6MjA3OTc5NDM2Nn0.XsiBpgTOo0Lskr5IpjViutsbnzTsFGR-eB5jL8mL6ao';

// Create and export the Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Import detectWebsiteId after supabase client is created to avoid circular dependency
import { detectWebsiteId } from './website-detector';

// Helper function to get the current website by subdomain with retry logic
export const getCurrentWebsiteId = async (subdomain: string = 'golden-crumb', retries: number = 3): Promise<string | null> => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('id')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

      if (error) {
        // If it's a network error (502, CORS, etc.), retry
        if (error.message?.includes('fetch') || error.message?.includes('NetworkError') || error.code === 'PGRST301') {
          if (i < retries - 1) {
            console.warn(`Attempt ${i + 1} failed, retrying...`, error.message);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
            continue;
          }
        }
        console.error('Error fetching website:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return (data as { id: string }).id;
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError || error.message?.includes('fetch') || error.message?.includes('NetworkError')) {
        if (i < retries - 1) {
          console.warn(`Network error on attempt ${i + 1}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        console.error('Network error after retries:', error);
        return null;
      }
      throw error;
    }
  }
  return null;
};

// For development, we'll use a cached website ID (but refresh it on each call to detect current website)
let cachedWebsiteId: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5000; // Cache for 5 seconds to avoid excessive calls

export const getWebsiteId = async (): Promise<string | null> => {
  // Always detect the current website from URL/subdomain instead of hardcoding
  // Use cache only for a short duration to avoid excessive API calls
  const now = Date.now();
  if (cachedWebsiteId && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedWebsiteId;
  }
  
  // Use detectWebsiteId to properly detect current website from URL parameters or subdomain
  const websiteId = await detectWebsiteId();
  
  if (websiteId) {
    cachedWebsiteId = websiteId;
    cacheTimestamp = now;
  }
  
  return websiteId;
};

