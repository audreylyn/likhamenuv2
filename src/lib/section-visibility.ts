/**
 * Section Visibility Utility
 * Checks if a section is enabled for the current website
 * Uses the enabledSections JSONB array in the websites table
 */

import { supabase } from "./supabase";
import { getWebsiteId } from "./supabase";

const sectionVisibilityCache = new Map<string, boolean>();
let enabledSectionsCache: string[] | null = null;
let cacheWebsiteId: string | null = null;

// All available sections
const ALL_SECTIONS = [
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

/**
 * Fetch enabled sections from the websites table
 */
async function fetchEnabledSections(websiteId: string): Promise<string[]> {
  // Check cache
  if (enabledSectionsCache && cacheWebsiteId === websiteId) {
    return enabledSectionsCache;
  }

  const { data, error } = await supabase
    .from("websites")
    .select("enabledsections")
    .eq("id", websiteId)
    .single();

  if (error) {
    console.error("Error fetching enabled sections:", error);
    return ALL_SECTIONS; // Default to all enabled on error
  }

  // enabledsections is a JSONB array of section names
  const enabledSections = (data?.enabledsections as string[]) || [];

  // Cache the result
  enabledSectionsCache = enabledSections;
  cacheWebsiteId = websiteId;

  return enabledSections;
}

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

    const enabledSections = await fetchEnabledSections(websiteId);

    // If enabledSections is empty, default all to enabled
    // Otherwise, check if section is in the enabled list
    const isEnabled =
      enabledSections.length === 0 || enabledSections.includes(sectionName);

    sectionVisibilityCache.set(cacheKey, isEnabled);
    return isEnabled;
  } catch (error) {
    console.error("Error checking section visibility:", error);
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

    const enabledSections = await fetchEnabledSections(websiteId);

    // If enabledSections is empty, return all sections
    return enabledSections.length === 0 ? ALL_SECTIONS : enabledSections;
  } catch (error) {
    console.error("Error fetching enabled sections:", error);
    return [];
  }
}

/**
 * Clear the visibility cache (useful after updates)
 */
export function clearSectionCache() {
  sectionVisibilityCache.clear();
  enabledSectionsCache = null;
  cacheWebsiteId = null;
}
