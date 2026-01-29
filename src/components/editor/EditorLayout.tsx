/**
 * Editor Layout
 * Wrapper for the editor interface
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Edit3, User, Sparkles } from 'lucide-react';
import type { UserProfile } from '../../types/auth.types';
import { ContentGeneratorModal } from './ContentGeneratorModal';
import { useWebsite } from '../../contexts/WebsiteContext';
import { getSubdomain } from '../../lib/website-detector';

interface EditorLayoutProps {
  children: React.ReactNode;
  isEditing: boolean;
  websiteTitle: string;
  user: UserProfile | null;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  children,
  isEditing,
  websiteTitle,
  user,
}) => {
  const navigate = useNavigate();
  const { currentWebsite } = useWebsite();
  const [showContentGenerator, setShowContentGenerator] = useState(false);

  const handleExitEditor = () => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.0.0.1');
    const hasSubdomain = !isLocalhost && getSubdomain(hostname) !== null;
    
    // If on subdomain, go back to public site (root)
    // Otherwise go to admin websites page
    if (hasSubdomain) {
      navigate('/');
    } else {
      navigate('/admin/websites');
    }
  };

  return (
    <div className="relative">
      {/* Top Editor Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Back Button */}
          <button
            onClick={handleExitEditor}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Exit Editor</span>
          </button>

          {/* Center: Website Title */}
          <div className="flex items-center gap-3 flex-1 justify-center">
            {isEditing ? (
              <Edit3 size={18} className="text-blue-600" />
            ) : (
              <Eye size={18} className="text-gray-600" />
            )}
            <h1 className="text-lg font-semibold text-gray-900">
              {websiteTitle}
            </h1>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              {isEditing ? 'Editing' : 'Preview'}
            </span>
          </div>

          {/* Right: Actions and User Info */}
          <div className="flex items-center gap-3">
            {/* Generate Content Button (only in edit mode) */}
            {isEditing && currentWebsite && (
              <button
                onClick={() => setShowContentGenerator(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                title="Generate AI content for this website"
              >
                <Sparkles size={18} />
                <span className="hidden sm:inline">Generate Content</span>
              </button>
            )}

            {/* User Info */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={20} className="text-gray-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content (with padding for top bar) */}
      <div className="pt-16">
        {children}
      </div>

      {/* Editor Mode Indicator */}
      {isEditing && (
        <div className="fixed top-20 right-4 z-40 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse">
          Click on any text to edit
        </div>
      )}

      {/* Content Generator Modal */}
      {currentWebsite && (
        <ContentGeneratorModal
          isOpen={showContentGenerator}
          onClose={() => setShowContentGenerator(false)}
          websiteId={currentWebsite}
          websiteTitle={websiteTitle}
        />
      )}
    </div>
  );
};

