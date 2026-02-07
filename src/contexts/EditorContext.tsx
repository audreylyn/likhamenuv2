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
import { useWebsite } from "./WebsiteContext";
import { useToast } from "../components/Toast";

import { supabase } from "../lib/supabase";

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
  const { refreshContent, currentWebsite } = useWebsite();
  const { showToast } = useToast();

  // ... refs ...

  /**
   * Save a single field within a section to websites.content JSONB
   */
  const saveField = useCallback(
    async (
      section: string,
      field: string,
      value: any,
      recordId?: string,
    ): Promise<void> => {
      try {
        // Use website ID from context instead of detecting again
        const websiteId = currentWebsite;
        if (!websiteId) {
          throw new Error(
            "No website ID found. Make sure you are accessing the site with ?site=subdomain parameter or correct subdomain.",
          );
        }

        // First fetch the current content
        const { data: websiteData, error: fetchError } = await (supabase
          .from("websites") as any)
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
        const { error: updateError } = await (supabase
          .from("websites") as any)
          .update({
            content: currentContent,
            updatedat: new Date().toISOString(),
          })
          .eq("id", websiteId);

        if (updateError) {
          console.error(`❌ Error saving ${section}.${field}:`, updateError);
          showToast(`Failed to save changes: ${updateError.message}`, 'error');
          throw updateError;
        }

        console.log(`✅ Saved content.${section}.${field}`);
        setHasChanges(true);

        // Refresh content to invalidate cache and update UI - await it
        await refreshContent();
      } catch (error) {
        console.error(`Error saving ${section}.${field}:`, error);
        throw error;
      }
    },
    [refreshContent, currentWebsite],
  );

  /**
   * Save entire section content to websites.content JSONB
   */
  const saveSectionContent = useCallback(
    async (section: string, content: any): Promise<void> => {
      try {
        // Use website ID from context instead of detecting again
        const websiteId = currentWebsite;
        if (!websiteId) {
          throw new Error("No website ID found.");
        }

        // First fetch the current content
        const { data: websiteData, error: fetchError } = await (supabase
          .from("websites") as any)
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
        const { error: updateError } = await (supabase
          .from("websites") as any)
          .update({
            content: currentContent,
            updatedat: new Date().toISOString(),
          })
          .eq("id", websiteId);

        if (updateError) {
          console.error(`❌ Error saving ${section}:`, updateError);
          showToast(`Failed to save changes: ${updateError.message}`, 'error');
          throw updateError;
        }

        console.log(`✅ Saved content.${section}`);
        setHasChanges(true);

        // Refresh content to invalidate cache and update UI - await it
        await refreshContent();
      } catch (error) {
        console.error(`Error saving ${section}:`, error);
        throw error;
      }
    },
    [refreshContent, currentWebsite],
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
      setIsEditing: () => { },
      saveField: async () => { },
      saveSectionContent: async () => { },
      hasChanges: false,
      setHasChanges: () => { },
    };
  }
  return context;
};
