/**
 * Floating Toolbar
 * Save/Publish controls at the bottom of the editor
 */

import React from 'react';
import { Save, Upload, Eye, Check, Loader } from 'lucide-react';

interface FloatingToolbarProps {
  hasChanges: boolean;
  isSaving: boolean;
  isPreviewMode: boolean;
  onSave: () => void;
  onPublish: () => void;
  onPreview: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  hasChanges,
  isSaving,
  isPreviewMode,
  onSave,
  onPublish,
  onPreview,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
        {/* Preview Toggle */}
        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition font-medium"
        >
          <Eye size={18} />
          {isPreviewMode ? 'Edit' : 'Preview'}
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-700" />

        {/* Auto-save Status */}
        <div className="flex items-center gap-2 px-3">
          {isSaving ? (
            <>
              <Loader size={16} className="animate-spin" />
              <span className="text-sm">Saving...</span>
            </>
          ) : hasChanges ? (
            <>
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span className="text-sm">Unsaved changes</span>
            </>
          ) : (
            <>
              <Check size={16} className="text-green-400" />
              <span className="text-sm">All changes saved</span>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-700" />

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          Save Draft
        </button>

        {/* Publish Button */}
        <button
          onClick={onPublish}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={18} />
          Publish
        </button>
      </div>
    </div>
  );
};

