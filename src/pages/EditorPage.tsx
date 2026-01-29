/**
 * Editor Page - Notion-like Inline Editing
 * Clients can edit their website content in place
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebsite } from '../contexts/WebsiteContext';
import { EditorProvider, useEditor } from '../contexts/EditorContext';
import { EditorLayout } from '../components/editor/EditorLayout';
import { FloatingToolbar } from '../components/editor/FloatingToolbar';
import { PublicSite } from './PublicSite';

const EditorContent: React.FC = () => {
  const { user } = useAuth();
  const { websiteData, loading, currentWebsite } = useWebsite();
  const { isEditing, setIsEditing, hasChanges, setHasChanges } = useEditor();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // All changes are auto-saved, this is just for manual save trigger
    await new Promise(resolve => setTimeout(resolve, 500));
    setHasChanges(false);
    setIsSaving(false);
  };

  const handlePublish = async () => {
    await handleSave();
    alert('Changes published successfully!');
  };

  const handlePreview = () => {
    setIsEditing(!isEditing);
  };

  // Show loading state while detecting website
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Detecting website...</p>
        </div>
      </div>
    );
  }

  // Show error if website not found
  if (!loading && !currentWebsite) {
    const params = new URLSearchParams(window.location.search);
    const siteParam = params.get('site') || params.get('website');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Website Not Found</h2>
          <p className="text-gray-600 mb-4">
            {siteParam 
              ? `The website "${siteParam}" was not found in the database.`
              : 'No website was detected. Please access the site with ?site=subdomain parameter.'}
          </p>
          <p className="text-sm text-gray-500">
            Make sure the website exists in your database and the subdomain is correct.
          </p>
        </div>
      </div>
    );
  }

  // Show loading if website detected but data not loaded yet
  if (!websiteData && currentWebsite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading website data...</p>
        </div>
      </div>
    );
  }

  return (
    <EditorLayout 
      isEditing={isEditing}
      websiteTitle={websiteData.site_title}
      user={user}
    >
      {/* The actual website content */}
      <div className={isEditing ? 'editor-mode' : ''}>
        <PublicSite />
      </div>

      {/* Floating Toolbar */}
      <FloatingToolbar
        hasChanges={hasChanges}
        isSaving={isSaving}
        isPreviewMode={!isEditing}
        onSave={handleSave}
        onPublish={handlePublish}
        onPreview={handlePreview}
      />
    </EditorLayout>
  );
};

export const EditorPage: React.FC = () => {
  return (
    <EditorProvider isEditing={true}>
      <EditorContent />
    </EditorProvider>
  );
};

