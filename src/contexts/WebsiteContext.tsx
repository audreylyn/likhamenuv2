/**
 * Website Context
 * Manages current website state (for client sites and editor)
 * OPTIMIZED: Single Supabase request for initial load
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getSubdomain } from "../lib/website-detector";
import type { WebsiteContextType } from "../types/auth.types";

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
  const [contentVersion, setContentVersion] = useState(0); // Version counter for refresh

  // Ref to prevent double-calling in React Strict Mode
  const isLoadingRef = React.useRef(false);

  useEffect(() => {
    // Prevent double-calling in React Strict Mode
    if (isLoadingRef.current) {
      console.log('[WebsiteContext] Already loading, skipping duplicate call');
      return;
    }
    isLoadingRef.current = true;

    // Don't block render - load website data asynchronously
    detectAndLoadWebsite().catch(console.error);
  }, []);

  // OPTIMIZED: Single query to detect AND load website data
  const detectAndLoadWebsite = async () => {
    try {
      // Check if running in browser
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const hostname = window.location.hostname;
      const params = new URLSearchParams(window.location.search);

      // Get subdomain or site parameter
      const siteParam = params.get('site') || params.get('website');
      const subdomain = siteParam || getSubdomain(hostname);

      if (!subdomain) {
        setLoading(false);
        return;
      }

      // Use direct fetch for faster loading
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        // On localhost, allow both published and draft websites for development
        const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.');
        const statusFilter = isLocalhost ? '' : '&status=eq.published';

        const response = await fetch(
          `${supabaseUrl}/rest/v1/websites?subdomain=eq.${subdomain}${statusFilter}&select=id,title,subdomain,status,theme,content,enabledsections,messenger,contactformconfig`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const websites = await response.json();

        if (websites && websites.length > 0) {
          const website = websites[0];
          sessionStorage.removeItem('inactive_website');
          setCurrentWebsite(website.id);
          processWebsiteData(website);
          return;
        } else {
          setLoading(false);
          return;
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('[WebsiteContext] Fetch failed:', fetchError.message);
        setLoading(false);
        return;
      }

    } catch (error) {
      console.error("[WebsiteContext] Error detecting website:", error);
      setLoading(false);
    }
  };

  // Process website data and update state
  const processWebsiteData = (website: any) => {
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
      "instagram",
      "footer",
      "chatSupport",
    ];

    const visibility: Record<string, boolean> = {};
    allSections.forEach((section) => {
      visibility[section] =
        enabledSections.length === 0 || enabledSections.includes(section);
    });
    setSectionVisibility(visibility);

    // Only set loading to false after all data is processed
    setLoading(false);
  };

  const applyThemeColors = (colors: any) => {
    const root = document.documentElement;
    root.style.setProperty("--bakery-primary", colors.primary || "#8B4513");
    root.style.setProperty("--bakery-accent", colors.accent || "#D2691E");
    root.style.setProperty("--bakery-cream", colors.cream || "#FFF8E7");
    root.style.setProperty("--bakery-dark", colors.dark || "#5D4037");
    root.style.setProperty("--bakery-light", colors.light || "#FFFFFF");
    root.style.setProperty("--bakery-text", colors.text || "#333333");
    // Use beige/sand from theme if available, otherwise derive from cream or use defaults
    root.style.setProperty(
      "--bakery-beige",
      colors.beige || colors.cream || "#F5F5DC",
    );
    root.style.setProperty(
      "--bakery-sand",
      colors.sand || colors.cream || "#E6DCC3",
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
        .select("id, title, subdomain, status, theme, content, enabledsections, messenger, contactformconfig")
        .eq("id", websiteId)
        .single();

      if (error) throw error;
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
      setCurrentWebsite: async () => { },
      loading: false,
      sectionVisibility: {},
      refreshContent: () => { },
      contentVersion: 0,
    };
  }
  return context;
};
