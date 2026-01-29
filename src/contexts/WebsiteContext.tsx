/**
 * Website Context
 * Manages current website state (for client sites and editor)
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { detectWebsiteId } from '../lib/website-detector';
import type { WebsiteContextType } from '../types/auth.types';

export const WebsiteContext = createContext<WebsiteContextType | undefined>(undefined);

export const WebsiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentWebsite, setCurrentWebsite] = useState<string | null>(null);
  const [websiteData, setWebsiteData] = useState<any | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [contentVersion, setContentVersion] = useState(0); // Version counter for refresh

  useEffect(() => {
    // Don't block render - load website data asynchronously
    detectAndLoadWebsite().catch(console.error);
  }, []);

  const detectAndLoadWebsite = async () => {
    try {
      const websiteId = await detectWebsiteId();
      
      if (websiteId) {
        setCurrentWebsite(websiteId);
        // Load website data and wait for it to complete before setting loading to false
        await loadWebsiteData(websiteId);
      } else {
        // No website found, stop loading
        setLoading(false);
      }
    } catch (error) {
      console.error('Error detecting website:', error);
      setLoading(false);
    }
  };

  const loadWebsiteData = async (websiteId: string) => {
    try {
      // Load website data, section visibility, and theme preset in parallel
      const [websiteResult, sectionsResult] = await Promise.all([
        supabase
          .from('websites')
          .select('*')
          .eq('id', websiteId)
          .single(),
        supabase
          .from('website_sections')
          .select('section_name, is_enabled')
          .eq('website_id', websiteId)
      ]);

      if (websiteResult.error) throw websiteResult.error;
      setWebsiteData(websiteResult.data);

      // Update document title with website name
      if (websiteResult.data?.site_title) {
        document.title = websiteResult.data.site_title;
      }

      // Load theme preset if website has one
      if (websiteResult.data?.theme_preset_id) {
        const { data: themeData, error: themeError } = await supabase
          .from('theme_presets')
          .select('*')
          .eq('id', websiteResult.data.theme_preset_id)
          .single();

        if (!themeError && themeData?.colors) {
          // Apply theme colors as CSS variables
          applyThemeColors(themeData.colors);
        }
      } else {
        // Apply default theme if no preset selected
        applyDefaultTheme();
      }

      // Build section visibility map
      if (sectionsResult.data) {
        const visibility: Record<string, boolean> = {};
        sectionsResult.data.forEach((section: any) => {
          visibility[section.section_name] = section.is_enabled ?? true;
        });
        setSectionVisibility(visibility);
      } else {
        // If no sections found, default all to enabled
        setSectionVisibility({});
      }
      
      // Only set loading to false after all data is loaded
      setLoading(false);
    } catch (error) {
      console.error('Error loading website data:', error);
      setLoading(false);
    }
  };

  const applyThemeColors = (colors: any) => {
    const root = document.documentElement;
    root.style.setProperty('--bakery-primary', colors.primary || '#8B4513');
    root.style.setProperty('--bakery-accent', colors.accent || '#D2691E');
    root.style.setProperty('--bakery-cream', colors.cream || '#FFF8E7');
    root.style.setProperty('--bakery-dark', colors.dark || '#5D4037');
    root.style.setProperty('--bakery-light', colors.light || '#FFFFFF');
    root.style.setProperty('--bakery-text', colors.text || '#333333');
    // Use beige/sand from theme if available, otherwise derive from cream or use defaults
    root.style.setProperty('--bakery-beige', colors.beige || colors.cream || '#F5F5DC');
    root.style.setProperty('--bakery-sand', colors.sand || colors.cream || '#E6DCC3');
  };

  const applyDefaultTheme = () => {
    const root = document.documentElement;
    root.style.setProperty('--bakery-primary', '#8B4513');
    root.style.setProperty('--bakery-accent', '#D2691E');
    root.style.setProperty('--bakery-cream', '#FFF8E7');
    root.style.setProperty('--bakery-dark', '#5D4037');
    root.style.setProperty('--bakery-light', '#FFFFFF');
    root.style.setProperty('--bakery-text', '#333333');
    root.style.setProperty('--bakery-beige', '#F5F5DC');
    root.style.setProperty('--bakery-sand', '#E6DCC3');
  };

  const changeWebsite = async (websiteId: string) => {
    setCurrentWebsite(websiteId);
    await loadWebsiteData(websiteId);
  };

  const refreshContent = () => {
    // Increment version to trigger components to refetch
    setContentVersion(prev => prev + 1);
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

  return <WebsiteContext.Provider value={value}>{children}</WebsiteContext.Provider>;
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

