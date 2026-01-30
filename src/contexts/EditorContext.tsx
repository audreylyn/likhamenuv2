/**
 * Editor Context
 * Manages editor mode state and save functionality
 * Uses JSONB approach - all content stored in websites.content column
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "../lib/supabase";
import { detectWebsiteId } from "../lib/website-detector";

interface EditorContextType {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  saveField: (
    section: string,
    field: string,
    value: any,
    recordId?: string,
  ) => Promise<void>;
  saveSectionContent: (section: string, content: any) => Promise<void>;
  hasChanges: boolean;
  setHasChanges: (hasChanges: boolean) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{
  children: React.ReactNode;
  isEditing: boolean;
}> = ({ children, isEditing: initialEditing }) => {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [hasChanges, setHasChanges] = useState(false);

  // Debounce save operations - batch rapid changes but save quickly
  const saveQueue = useRef<
    Map<string, { section: string; field: string; value: any }>
  >(new Map());
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Save a single field within a section to websites.content JSONB
   * @param section - The section name (e.g., 'navbar', 'hero', 'about')
   * @param field - The field name within the section
   * @param value - The value to save
   * @param recordId - Optional, ignored in JSONB approach but kept for compatibility
   */
  const saveField = useCallback(
    async (
      section: string,
      field: string,
      value: any,
      recordId?: string,
    ): Promise<void> => {
      try {
        const websiteId = await detectWebsiteId();
        if (!websiteId) {
          throw new Error(
            "No website ID found. Make sure you are accessing the site with ?site=subdomain parameter or correct subdomain.",
          );
        }

        // First fetch the current content
        const { data: websiteData, error: fetchError } = await supabase
          .from("websites")
          .select("content")
          .eq("id", websiteId)
          .single();

        if (fetchError) throw fetchError;

        // Get current content or initialize empty object
        const currentContent =
          (websiteData?.content as Record<string, any>) || {};

        // Get current section content or initialize empty object
        const sectionContent = currentContent[section] || {};

        // Update the specific field
        sectionContent[field] = value;

        // Update the section in content
        currentContent[section] = sectionContent;

        // Save back to database
        const { error: updateError } = await supabase
          .from("websites")
          .update({
            content: currentContent,
            updatedat: new Date().toISOString(),
          })
          .eq("id", websiteId);

        if (updateError) {
          console.error(`❌ Error saving ${section}.${field}:`, updateError);
          alert(`Failed to save changes: ${updateError.message}`);
          throw updateError;
        }

        console.log(`✅ Saved content.${section}.${field}`);
        setHasChanges(true);
      } catch (error) {
        console.error(`Error saving ${section}.${field}:`, error);
        throw error;
      }
    },
    [],
  );

  /**
   * Save entire section content to websites.content JSONB
   * @param section - The section name (e.g., 'navbar', 'hero', 'about')
   * @param content - The entire section content object
   */
  const saveSectionContent = useCallback(
    async (section: string, content: any): Promise<void> => {
      try {
        const websiteId = await detectWebsiteId();
        if (!websiteId) {
          throw new Error("No website ID found.");
        }

        // First fetch the current content
        const { data: websiteData, error: fetchError } = await supabase
          .from("websites")
          .select("content")
          .eq("id", websiteId)
          .single();

        if (fetchError) throw fetchError;

        // Get current content or initialize empty object
        const currentContent =
          (websiteData?.content as Record<string, any>) || {};

        // Update the entire section
        currentContent[section] = content;

        // Save back to database
        const { error: updateError } = await supabase
          .from("websites")
          .update({
            content: currentContent,
            updatedat: new Date().toISOString(),
          })
          .eq("id", websiteId);

        if (updateError) {
          console.error(`❌ Error saving ${section}:`, updateError);
          alert(`Failed to save changes: ${updateError.message}`);
          throw updateError;
        }

        console.log(`✅ Saved content.${section}`);
        setHasChanges(true);
      } catch (error) {
        console.error(`Error saving ${section}:`, error);
        throw error;
      }
    },
    [],
  );

  const value: EditorContextType = {
    isEditing,
    setIsEditing,
    saveField,
    saveSectionContent,
    hasChanges,
    setHasChanges,
  };

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  // Return a default context if not in editor mode (for public site)
  if (context === undefined) {
    return {
      isEditing: false,
      setIsEditing: () => {},
      saveField: async () => {},
      saveSectionContent: async () => {},
      hasChanges: false,
      setHasChanges: () => {},
    };
  }
  return context;
};
