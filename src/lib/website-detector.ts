/**
 * Website Detection Utility
 * Detects current website from subdomain or query parameter
 * OPTIMIZED: Single auth check, parallel fetching
 */

import { supabase } from './supabase';

// Cache for auth user to avoid repeated calls
let cachedUser: any = null;
let userCacheTime = 0;
const USER_CACHE_TTL = 30000; // 30 seconds

/**
 * Get cached user or fetch fresh
 */
async function getCachedUser() {
  const now = Date.now();
  if (cachedUser !== null && (now - userCacheTime) < USER_CACHE_TTL) {
    return cachedUser;
  }

  const { data: { user } } = await supabase.auth.getUser();
  cachedUser = user;
  userCacheTime = now;
  return user;
}

/**
 * Extract subdomain from hostname
 * Supports:
 * - Production: rose.likhamenu.studio → rose
 * - Vercel preview: likhamenuv2-xxx.vercel.app → null (use ?site= param)
 * - Localhost: localhost → null (use ?site= param)
 */
export function getSubdomain(hostname: string): string | null {
  // Skip localhost and IP addresses
  if (!hostname || hostname === 'localhost' || hostname.startsWith('127.')) {
    return null;
  }

  // Skip Vercel preview URLs (use ?site= param instead)
  if (hostname.includes('vercel.app')) {
    return null;
  }

  // Get the main domain from env
  const mainDomain = import.meta.env.VITE_DOMAIN || 'likhamenu.studio';

  // Check if this is a subdomain of the main domain
  // Example: rose.likhamenu.studio → rose
  if (hostname.endsWith(`.${mainDomain}`)) {
    const subdomain = hostname.replace(`.${mainDomain}`, '');
    // Ignore www
    if (subdomain === 'www') {
      return null;
    }
    return subdomain;
  }

  // Fallback: Extract first part of hostname for other domains
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain !== 'www' && subdomain !== 'admin') {
      return subdomain;
    }
  }

  return null;
}

/**
 * Get current website ID from subdomain or query parameter
 * OPTIMIZED: Try published first (fast path), auth check only as fallback
 * 
 * Access rules:
 * - Query param (?site=): Works for both draft and published (admin preview)
 * - Subdomain: Only works for published websites (client access)
 */
export async function detectWebsiteId(): Promise<string | null> {
  try {
    // Check if running in browser
    if (typeof window === 'undefined') {
      return null;
    }

    const hostname = window.location.hostname;
    const params = new URLSearchParams(window.location.search);

    // Check if accessing via query param (for admin preview)
    const siteParam = params.get('site') || params.get('website');
    const subdomain = siteParam || getSubdomain(hostname);

    // Track how we're accessing - query param allows drafts, subdomain does not
    const isQueryParamAccess = !!siteParam;

    if (!subdomain) {
      return null;
    }

    // FAST PATH: Try to fetch published website first (no auth check needed)
    // This is the common case for public visitors
    const { data: publishedData, error: publishedError } = await supabase
      .from('websites')
      .select('id')
      .eq('subdomain', subdomain)
      .eq('status', 'published')
      .maybeSingle();

    if (publishedData) {
      sessionStorage.removeItem('inactive_website');
      return (publishedData as any).id;
    }

    // If accessing via query param, allow draft access (for admin preview)
    if (isQueryParamAccess) {
      const { data: draftData, error: draftError } = await supabase
        .from('websites')
        .select('id')
        .eq('subdomain', subdomain)
        .maybeSingle();

      if (draftData) {
        sessionStorage.removeItem('inactive_website');
        return (draftData as any).id;
      }
    }

    // Subdomain access to draft website - mark as inactive
    if (!isQueryParamAccess) {
      const { data: inactiveWebsite } = await supabase
        .from('websites')
        .select('id, status')
        .eq('subdomain', subdomain)
        .maybeSingle();

      if (inactiveWebsite && (inactiveWebsite as any).status !== 'published') {
        sessionStorage.setItem('inactive_website', subdomain);
      }
    }

    return null;
  } catch (error) {
    console.error('Error detecting website:', error);
    return null;
  }
}

/**
 * Clear user cache (call on login/logout)
 */
export function clearUserCache() {
  cachedUser = null;
  userCacheTime = 0;
}

/**
 * Check if current route is admin
 */
export function isAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/admin');
}

/**
 * Check if current route is editor
 */
export function isEditorRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/edit');
}

/**
 * Get current mode: 'public' | 'editor' | 'admin'
 */
export function getCurrentMode(): 'public' | 'editor' | 'admin' {
  if (isAdminRoute()) return 'admin';
  if (isEditorRoute()) return 'editor';
  return 'public';
}

/**
 * Detect website subdomain from URL (no database query)
 * Fast way to get subdomain for knowledge base lookup
 */
export function detectWebsiteSubdomain(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname;
  const params = new URLSearchParams(window.location.search);

  // Development: Check for ?site= parameter first
  const siteParam = params.get('site') || params.get('website');
  if (siteParam) {
    return siteParam;
  }

  // Production: Extract from subdomain
  return getSubdomain(hostname);
}

/**
 * Build URL for website
 */
export function buildWebsiteUrl(
  subdomain: string,
  path: string = '',
  mode: 'public' | 'editor' = 'public'
): string {
  const isDev = window.location.hostname === 'localhost';

  if (isDev) {
    // Development: Use query parameter
    const base = `http://localhost:${window.location.port || 3000}`;
    const editPath = mode === 'editor' ? '/edit' : '';
    return `${base}${editPath}${path}?site=${subdomain}`;
  } else {
    // Production: Use subdomain
    const domain = (import.meta as any).env.VITE_DOMAIN || 'likhasiteworks.studio';
    const editPath = mode === 'editor' ? '/edit' : '';
    return `https://${subdomain}.${domain}${editPath}${path}`;
  }
}
