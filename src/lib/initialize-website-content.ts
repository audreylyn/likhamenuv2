/**
 * Initialize default website content
 * Called when a new website is created
 * Tries to copy from golden-crumb template, falls back to default content
 */

import { copyWebsiteContent } from './copy-website-content';
import { populateDefaultContent } from './default-content';

export async function initializeWebsiteContent(websiteId: string, enabledSections?: string[]) {
  console.log('🚀 initializeWebsiteContent called for:', websiteId, 'with sections:', enabledSections);

  try {
    // Try to copy all content from golden-crumb website
    // Pass enabled sections to control which sections are enabled
    console.log('📋 Attempting to copy from golden-crumb template...');
    await copyWebsiteContent(websiteId, undefined, enabledSections);

    console.log('✅ Website content initialized from golden-crumb template');
  } catch (error) {
    console.warn('⚠️ Could not copy from golden-crumb template, using default content:', error);

    // Fallback: use default sample content
    try {
      console.log('📋 Falling back to default sample content...');
      await populateDefaultContent(websiteId);
      console.log('✅ Website content initialized with default sample content');
    } catch (fallbackError) {
      console.error('❌ Failed to populate default content:', fallbackError);
      throw fallbackError;
    }
  }
}
