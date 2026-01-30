/**
 * Supabase Client Configuration
 * LikhaSiteWorks - Database connection setup
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase.types";

// Supabase connection details
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}

// Create and export the Supabase client
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Disable URL session detection for faster load
      flowType: "implicit", // Use implicit flow for faster auth
    },
    global: {
      // Optimize fetch for faster requests
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          // Don't include credentials for public API calls
          credentials: "same-origin",
        });
      },
    },
  },
);

// Helper function to get the current website by subdomain with retry logic
export const getCurrentWebsiteId = async (
  subdomain: string = "golden-crumb",
  retries: number = 3,
): Promise<string | null> => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase
        .from("websites")
        .select("id")
        .eq("subdomain", subdomain)
        .eq("status", "published")
        .single();

      if (error) {
        // If it's a network error (502, CORS, etc.), retry
        if (
          error.message?.includes("fetch") ||
          error.message?.includes("NetworkError") ||
          error.code === "PGRST301"
        ) {
          if (i < retries - 1) {
            console.warn(`Attempt ${i + 1} failed, retrying...`, error.message);
            await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
            continue;
          }
        }
        console.error("Error fetching website:", error);
        return null;
      }

      if (!data) {
        return null;
      }

      return (data as { id: string }).id;
    } catch (error: any) {
      // Handle network errors
      if (
        error instanceof TypeError ||
        error.message?.includes("fetch") ||
        error.message?.includes("NetworkError")
      ) {
        if (i < retries - 1) {
          console.warn(`Network error on attempt ${i + 1}, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        console.error("Network error after retries:", error);
        return null;
      }
      throw error;
    }
  }
  return null;
};

// Re-export getWebsiteId from website-detector for backwards compatibility
// This creates a lazy import to avoid circular dependency issues
export const getWebsiteId = async (): Promise<string | null> => {
  // Dynamic import to break circular dependency
  const { detectWebsiteId } = await import("./website-detector");
  return detectWebsiteId();
};
