/**
 * Website Context
 * Manages current website state (for client sites and editor)
 * OPTIMIZED: Simple caching with direct fetch
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import { getSubdomain } from "../lib/website-detector";
import type { WebsiteContextType } from "../types/auth.types";

// Simple cache configuration
const CACHE_KEY_PREFIX = "likhamenu_website_";
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

interface CachedWebsite {
  data: any;
  timestamp: number;
}

// Helper to get cached website data
const getCachedWebsite = (subdomain: string): any | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + subdomain);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as CachedWebsite;
    const age = Date.now() - parsed.timestamp;

    // Return null if cache is expired
    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_KEY_PREFIX + subdomain);
      return null;
    }

    return parsed.data;
  } catch (e) {
    return null;
  }
};

// Helper to save website data to cache
const setCachedWebsite = (subdomain: string, data: any) => {
  try {
    const cached: CachedWebsite = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY_PREFIX + subdomain, JSON.stringify(cached));
  } catch (e) {
    // Storage full or unavailable - ignore
  }
};

export const WebsiteContext = createContext<WebsiteContextType | undefined>(
  undefined,
);

export const WebsiteProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentWebsite, setCurrentWebsite] = useState<string | null>(null);
  const [websiteData, setWebsiteData] = useState<any | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(true);
  const [contentVersion, setContentVersion] = useState(0);

  // Process website data and update state
  const processWebsiteData = useCallback((website: any) => {
    setWebsiteData(website);

    // Update document title with website name
    if (website?.title) {
      document.title = website.title;
    }

    // Apply theme from the theme JSONB column
    if (website?.theme?.colors) {
      applyThemeColors(website.theme.colors);
    } else {
      applyDefaultTheme();
    }

    // Build section visibility map from enabledsections JSONB array
    const enabledSections = (website?.enabledsections as string[]) || [];

    const allSections = [
      "hero",
      "about",
      "whyChooseUs",
      "team",
      "featuredProducts",
      "menu",
      "reservation",
      "testimonials",
      "specialOffers",
      "faq",
      "contact",
      "instagramFeed",
      "footer",
      "chatSupport",
    ];

    const visibility: Record<string, boolean> = {};
    allSections.forEach((section) => {
      visibility[section] =
        enabledSections.length === 0 || enabledSections.includes(section);
    });
    setSectionVisibility(visibility);

    setLoading(false);
  }, []);

  useEffect(() => {
    detectAndLoadWebsite();
  }, []);

  // Detect website from URL and load data
  const detectAndLoadWebsite = async () => {
    try {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const hostname = window.location.hostname;
      const params = new URLSearchParams(window.location.search);

      // Get subdomain or site parameter
      const siteParam = params.get("site") || params.get("website");
      const subdomain = siteParam || getSubdomain(hostname);
      const allowDraft = !!siteParam;

      if (!subdomain) {
        setLoading(false);
        return;
      }

      // Check cache first for instant loading
      const cached = getCachedWebsite(subdomain);
      if (cached) {
        console.log("[WebsiteContext] Using cached data for", subdomain);
        sessionStorage.removeItem("inactive_website");
        setCurrentWebsite(cached.id);
        processWebsiteData(cached);
        return;
      }

      // No cache - fetch from network
      await fetchWebsite(subdomain, hostname, allowDraft);
    } catch (error) {
      console.error("[WebsiteContext] Error detecting website:", error);
      setLoading(false);
    }
  };

  // Fetch website data from Supabase
  const fetchWebsite = async (
    subdomain: string,
    hostname: string,
    allowDraft: boolean,
  ) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const isLocalhost =
        hostname === "localhost" || hostname.startsWith("127.");

      // Draft access rules:
      // - Localhost: allow draft & published
      // - Query-param access (?site=): allow draft & published (admin preview)
      // - Subdomain access: published only
      const statusFilter = isLocalhost || allowDraft ? "" : "&status=eq.published";

      const response = await fetch(
        `${supabaseUrl}/rest/v1/websites?subdomain=eq.${subdomain}${statusFilter}&select=id,title,subdomain,status,theme,content,enabledsections,messenger,contactformconfig`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const websites = await response.json();

      if (websites && websites.length > 0) {
        const website = websites[0];
        sessionStorage.removeItem("inactive_website");

        // Cache the website data
        setCachedWebsite(subdomain, website);

        setCurrentWebsite(website.id);
        processWebsiteData(website);
      } else {
        setLoading(false);
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error("[WebsiteContext] Fetch failed:", fetchError.message);
      setLoading(false);
    }
  };

  const applyThemeColors = (colors: any) => {
    console.log('[WebsiteContext] Applying theme colors:', colors);
    const root = document.documentElement;
    // Map theme colors to CSS variables - handle both new and legacy formats
    root.style.setProperty("--bakery-primary", colors.primary || "#8B4513");
    root.style.setProperty("--bakery-accent", colors.accent || colors.secondary || "#D2691E");
    root.style.setProperty("--bakery-cream", colors.cream || colors.background || "#FFF8E7");
    root.style.setProperty("--bakery-dark", colors.dark || colors.text || "#5D4037");
    root.style.setProperty("--bakery-light", colors.light || "#FFFFFF");
    root.style.setProperty("--bakery-text", colors.text || colors.dark || "#333333");
    // Use beige/sand from theme if available, otherwise derive from cream or use defaults
    root.style.setProperty(
      "--bakery-beige",
      colors.beige || colors.cream || colors.background || "#F5F5DC",
    );
    root.style.setProperty(
      "--bakery-sand",
      colors.sand || colors.cream || colors.background || "#E6DCC3",
    );
  };

  const applyDefaultTheme = () => {
    const root = document.documentElement;
    root.style.setProperty("--bakery-primary", "#8B4513");
    root.style.setProperty("--bakery-accent", "#D2691E");
    root.style.setProperty("--bakery-cream", "#FFF8E7");
    root.style.setProperty("--bakery-dark", "#5D4037");
    root.style.setProperty("--bakery-light", "#FFFFFF");
    root.style.setProperty("--bakery-text", "#333333");
    root.style.setProperty("--bakery-beige", "#F5F5DC");
    root.style.setProperty("--bakery-sand", "#E6DCC3");
  };

  // loadWebsiteData - for programmatic changes (changeWebsite, refreshContent)
  const loadWebsiteData = async (websiteId: string) => {
    try {
      const { data: website, error } = await supabase
        .from("websites")
        .select(
          "id, title, subdomain, status, theme, content, enabledsections, messenger, contactformconfig",
        )
        .eq("id", websiteId)
        .single();

      if (error) throw error;

      // Update cache with fresh data
      if (website?.subdomain) {
        setCachedWebsite(website.subdomain, website);
      }

      processWebsiteData(website);
    } catch (error) {
      console.error("Error loading website data:", error);
      setLoading(false);
    }
  };

  const changeWebsite = async (websiteId: string) => {
    setCurrentWebsite(websiteId);
    await loadWebsiteData(websiteId);
  };

  const refreshContent = () => {
    // Increment version to trigger components to refetch
    setContentVersion((prev) => prev + 1);

    // Clear cache for current website to force fresh fetch
    if (websiteData?.subdomain) {
      localStorage.removeItem(CACHE_KEY_PREFIX + websiteData.subdomain);
    }

    // Also reload website data if we have a current website
    if (currentWebsite) {
      loadWebsiteData(currentWebsite).catch(console.error);
    }
  };

  const value: WebsiteContextType = {
    currentWebsite,
    websiteData,
    setCurrentWebsite: changeWebsite,
    loading,
    sectionVisibility,
    refreshContent,
    contentVersion,
  };

  return (
    <WebsiteContext.Provider value={value}>{children}</WebsiteContext.Provider>
  );
};

export const useWebsite = () => {
  const context = useContext(WebsiteContext);
  if (context === undefined) {
    // Return default values if not in provider (for components that might be used outside)
    return {
      currentWebsite: null,
      websiteData: null,
      setCurrentWebsite: async () => {},
      loading: false,
      sectionVisibility: {},
      refreshContent: () => {},
      contentVersion: 0,
    };
  }
  return context;
};
