/**
 * Editor Context
 * Manages editor mode state and save functionality
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { detectWebsiteId } from '../lib/website-detector';

interface EditorContextType {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  saveField: (table: string, field: string, value: any, recordId?: string) => Promise<void>;
  hasChanges: boolean;
  setHasChanges: (hasChanges: boolean) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode; isEditing: boolean }> = ({ 
  children, 
  isEditing: initialEditing 
}) => {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [hasChanges, setHasChanges] = useState(false);

  // Debounce save operations - batch rapid changes but save quickly
  const saveQueue = useRef<Map<string, { table: string; field: string; value: any; recordId?: string }>>(new Map());
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveField = useCallback(async (
    table: string, 
    field: string, 
    value: any, 
    recordId?: string
  ): Promise<void> => {
    try {
      // Use detectWebsiteId to properly detect current website from URL/subdomain
      const websiteId = await detectWebsiteId();
      if (!websiteId) {
        throw new Error('No website ID found. Make sure you are accessing the site with ?site=subdomain parameter or correct subdomain.');
      }

      // Create a unique key for this field
      const key = `${table}-${field}-${recordId || websiteId}`;
      
      // Add to save queue
      saveQueue.current.set(key, { table, field, value, recordId });

      // Clear existing timeout
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      // Immediate save for single change, debounce for rapid changes
      const queueSize = saveQueue.current.size;
      
      if (queueSize === 1) {
        // Single change - save immediately (no delay)
        const item = Array.from(saveQueue.current.values())[0];
        saveQueue.current.clear();

        // Execute save immediately and await it
        const updateData: any = { [item.field]: item.value };
        let query = supabase.from(item.table).update(updateData);
        
        if (item.recordId) {
          // Always verify website_id to prevent cross-website updates
          query = query.eq('id', item.recordId).eq('website_id', websiteId);
        } else {
          query = query.eq('website_id', websiteId);
        }

        const { error, data } = await query;
        
        if (error) {
          console.error(`❌ Error saving ${item.table}.${item.field}:`, error);
          console.error('Record ID:', item.recordId);
          console.error('Value:', item.value);
          console.error('Table:', item.table);
          console.error('Field:', item.field);
          // Show user-friendly error
          alert(`Failed to save changes: ${error.message}\n\nTable: ${item.table}\nField: ${item.field}\nRecord ID: ${item.recordId || 'N/A'}`);
          throw error;
        } else {
          console.log(`✅ Saved ${item.table}.${item.field}`, data);
          setHasChanges(true);
        }
      } else {
        // Multiple changes - debounce to batch them
        return new Promise<void>((resolve, reject) => {
          saveTimeout.current = setTimeout(async () => {
            const queue = Array.from(saveQueue.current.values());
            saveQueue.current.clear();

            // Use detectWebsiteId to properly detect current website from URL/subdomain
            const websiteId = await detectWebsiteId();
            if (!websiteId) {
              reject(new Error('No website ID found. Make sure you are accessing the site with ?site=subdomain parameter or correct subdomain.'));
              return;
            }

            const errors: string[] = [];

            for (const item of queue) {
              try {
                const updateData: any = { [item.field]: item.value };
                
                let query = supabase.from(item.table).update(updateData);
                
                if (item.recordId) {
                  // Always verify website_id to prevent cross-website updates
                  query = query.eq('id', item.recordId).eq('website_id', websiteId);
                } else {
                  query = query.eq('website_id', websiteId);
                }

                const { error, data } = await query;
                if (error) {
                  console.error(`❌ Error saving ${item.table}.${item.field}:`, error);
                  console.error('Record ID:', item.recordId);
                  console.error('Value:', item.value);
                  errors.push(`${item.table}.${item.field}: ${error.message}`);
                } else {
                  console.log(`✅ Saved ${item.table}.${item.field}`, data);
                }
              } catch (err: any) {
                console.error('Batch save failed for', item.table, item.field, err);
                errors.push(`${item.table}.${item.field}: ${err.message}`);
              }
            }

            setHasChanges(true);
            
            if (errors.length > 0) {
              alert(`Some changes failed to save:\n\n${errors.join('\n')}`);
              reject(new Error(errors.join('; ')));
            } else {
              resolve();
            }
          }, 100); // 100ms debounce for batch saves
        });
      }

    } catch (error) {
      console.error(`Error queuing save for ${table}.${field}:`, error);
      throw error;
    }
  }, []);

  const value: EditorContextType = {
    isEditing,
    setIsEditing,
    saveField,
    hasChanges,
    setHasChanges,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  // Return a default context if not in editor mode (for public site)
  if (context === undefined) {
    return {
      isEditing: false,
      setIsEditing: () => {},
      saveField: async () => {},
      hasChanges: false,
      setHasChanges: () => {},
    };
  }
  return context;
};

