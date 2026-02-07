/**
 * Editor Page - Notion-like Inline Editing
 * Clients can edit their website content in place
 * Password protected for security
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebsite } from '../contexts/WebsiteContext';
import { EditorProvider, useEditor } from '../contexts/EditorContext';
import { EditorLayout } from '../components/editor/EditorLayout';
import { FloatingToolbar } from '../components/editor/FloatingToolbar';
import { PublicSite } from './PublicSite';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../components/Toast';

const EditorContent: React.FC = () => {
  const { user } = useAuth();
  const { websiteData, loading, currentWebsite, refreshContent } = useWebsite();
  const { isEditing, setIsEditing, hasChanges, setHasChanges } = useEditor();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Password protection state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if password is required (no auto-authentication via storage)
  useEffect(() => {
    const checkAuth = async () => {
      if (currentWebsite) {
        // Check if website has a password set
        const { data, error } = await supabase
          .from('websites')
          .select('password')
          .eq('id', currentWebsite)
          .single();

        if (error) {
          console.error('Error checking password:', error);
          setCheckingAuth(false);
          return;
        }

        const storedPassword = (data as any)?.password;

        // If no password is set, auto-authenticate
        if (!storedPassword) {
          setIsAuthenticated(true);
        }

        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [currentWebsite]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Fetch the password from database
    const { data, error } = await supabase
      .from('websites')
      .select('password')
      .eq('id', currentWebsite)
      .single();

    if (error) {
      setPasswordError('Error verifying password. Please try again.');
      return;
    }

    const storedPassword = (data as any)?.password;

    // If no password is set, allow access
    if (!storedPassword) {
      setIsAuthenticated(true);
      return;
    }

    // Check password
    if (passwordInput === storedPassword) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // All changes are auto-saved, this is just for manual save trigger
    await new Promise(resolve => setTimeout(resolve, 500));
    setHasChanges(false);
    setIsSaving(false);
  };

  const handlePublish = async () => {
    if (!currentWebsite) return;

    setIsSaving(true);
    try {
      // Ensure any UI state marked as changed is cleared
      await handleSave();

      const { error } = await supabase
        .from('websites')
        .update({
          status: 'published',
          updatedat: new Date().toISOString(),
        })
        .eq('id', currentWebsite);

      if (error) {
        console.error('❌ Publish failed:', error);
        showToast(`Failed to publish: ${error.message}`, 'error');
        return;
      }

      // Force fresh content + clear cache
      refreshContent();
      setHasChanges(false);
      showToast('Changes published successfully!', 'success');
    } finally {
      setIsSaving(false);
    }
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

  // Show checking auth state
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // Password protection screen
  if (!isAuthenticated && websiteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Password Required</h2>
            <p className="text-gray-600 mt-2">
              Enter the password to edit <strong>{websiteData.title || websiteData.subdomain}</strong>
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Enter password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {passwordError && (
              <p className="text-sm text-red-600 mt-2">{passwordError}</p>
            )}

            <button
              type="submit"
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium mt-4"
            >
              Unlock & Edit
            </button>

            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition mt-3"
            >
              Cancel
            </button>
          </form>
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

