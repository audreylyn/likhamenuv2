/**
 * Section Visibility Utility
 * Checks if a section is enabled for the current website
 */

import { supabase } from './supabase';
import { getWebsiteId } from './supabase';

const sectionVisibilityCache = new Map<string, boolean>();

/**
 * Check if a section is enabled for the current website
 */
export async function isSectionEnabled(sectionName: string): Promise<boolean> {
  try {
    const websiteId = await getWebsiteId();
    if (!websiteId) return true; // Default to enabled if no website

    // Check cache first
    const cacheKey = `${websiteId}-${sectionName}`;
    if (sectionVisibilityCache.has(cacheKey)) {
      return sectionVisibilityCache.get(cacheKey)!;
    }

    const { data, error } = await supabase
      .from('website_sections')
      .select('is_enabled')
      .eq('website_id', websiteId)
      .eq('section_name', sectionName)
      .single();

    if (error) {
      // If section doesn't exist, default to enabled
      if (error.code === 'PGRST116') {
        return true;
      }
      console.error('Error checking section visibility:', error);
      return true; // Default to enabled on error
    }

    const isEnabled = data?.is_enabled ?? true;
    sectionVisibilityCache.set(cacheKey, isEnabled);
    return isEnabled;
  } catch (error) {
    console.error('Error checking section visibility:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Get all enabled sections for the current website
 */
export async function getEnabledSections(): Promise<string[]> {
  try {
    const websiteId = await getWebsiteId();
    if (!websiteId) return [];

    const { data, error } = await supabase
      .from('website_sections')
      .select('section_name')
      .eq('website_id', websiteId)
      .eq('is_enabled', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching enabled sections:', error);
      return [];
    }

    return data?.map((s: any) => s.section_name) || [];
  } catch (error) {
    console.error('Error fetching enabled sections:', error);
    return [];
  }
}

/**
 * Clear the visibility cache (useful after updates)
 */
export function clearSectionCache() {
  sectionVisibilityCache.clear();
}

