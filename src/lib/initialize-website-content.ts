/**
 * Initialize default website content
 * Called when a new website is created
 * Now copies all content from golden-crumb website as the template
 */

import { copyWebsiteContent } from './copy-website-content';

export async function initializeWebsiteContent(websiteId: string, enabledSections?: string[]) {
  try {
    // Copy all content from golden-crumb website
    // Pass enabled sections to control which sections are enabled
    await copyWebsiteContent(websiteId, undefined, enabledSections);
    
    console.log('✅ Website content initialized from golden-crumb template');
  } catch (error) {
    console.error('Error initializing website content:', error);
    throw error;
  }
}
