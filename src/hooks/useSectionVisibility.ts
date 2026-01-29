/**
 * React Hook for Section Visibility
 * Uses WebsiteContext for instant access (no flash)
 */

import { useContext, useState, useEffect } from 'react';
import { WebsiteContext } from '../contexts/WebsiteContext';
import { isSectionEnabled } from '../lib/section-visibility';

export function useSectionVisibility(sectionName: string): boolean | null {
  // Try to get from context first (instant, no flash)
  const websiteContext = useContext(WebsiteContext);
  
  // If context is available and has section visibility loaded, use it immediately
  if (websiteContext && websiteContext.sectionVisibility) {
    const isEnabled = websiteContext.sectionVisibility[sectionName];
    // If section is explicitly set, return that value
    // If not found in map, default to null (unknown/loading)
    if (isEnabled !== undefined) {
      return isEnabled;
    }
  }

  // Fallback: async check (only if context not available or section not in map)
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    // Skip if we already have it from context
    if (websiteContext?.sectionVisibility?.[sectionName] !== undefined) {
      return;
    }

    let mounted = true;

    isSectionEnabled(sectionName).then((enabled) => {
      if (mounted) {
        setIsEnabled(enabled);
      }
    });

    return () => {
      mounted = false;
    };
  }, [sectionName, websiteContext?.sectionVisibility]);

  // If we have a value from context, use it; otherwise use async result
  if (websiteContext?.sectionVisibility?.[sectionName] !== undefined) {
    return websiteContext.sectionVisibility[sectionName];
  }

  return isEnabled;
}

