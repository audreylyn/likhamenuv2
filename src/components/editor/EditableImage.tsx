/**
 * Editable Image Component
 * Allows uploading images to Supabase storage in editor mode
 */

import React, { useState, useRef } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EditableImageProps {
  src: string;
  alt: string;
  onSave: (newUrl: string) => Promise<void>;
  className?: string;
  containerClassName?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  bucketName?: string;
}

export const EditableImage: React.FC<EditableImageProps> = ({
  src,
  alt,
  onSave,
  className = '',
  containerClassName = '',
  placeholder = 'Click to upload image',
  aspectRatio = 'auto',
  bucketName = 'images',
}) => {
  const { isEditing } = useEditor();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  }[aspectRatio];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      // Save the new URL
      await onSave(urlData.publicUrl);
      setShowOptions(false);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlInput = async () => {
    const url = prompt('Enter image URL:', src);
    if (url === null) return; // User cancelled

    try {
      setIsUploading(true);
      await onSave(url);
      setShowOptions(false);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save image URL');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!window.confirm('Remove this image?')) return;

    try {
      setIsUploading(true);
      await onSave('');
      setShowOptions(false);
    } catch (err: any) {
      console.error('Remove error:', err);
      setError(err.message || 'Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };

  // Non-editing mode - just display the image
  if (!isEditing) {
    if (!src) {
      return null;
    }
    return (
      <div className={`${containerClassName} ${aspectRatioClass}`}>
        <img src={src} alt={alt} className={className} />
      </div>
    );
  }

  // Editing mode
  return (
    <div className={`relative group ${containerClassName} ${aspectRatioClass}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image or placeholder */}
      {src ? (
        <img src={src} alt={alt} className={`${className} ${isUploading ? 'opacity-50' : ''}`} />
      ) : (
        <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-400`}>
          <div className="text-center p-4">
            <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">{placeholder}</p>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
          <Loader2 className="animate-spin text-white" size={32} />
        </div>
      )}

      {/* Edit button - shows on hover */}
      {!isUploading && (
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Upload size={16} />
        </button>
      )}

      {/* Options menu */}
      {showOptions && !isUploading && (
        <div className="absolute top-12 right-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Upload size={16} />
            Upload Image
          </button>
          <button
            onClick={handleUrlInput}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <ImageIcon size={16} />
            Enter URL
          </button>
          {src && (
            <button
              onClick={handleRemoveImage}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-100 text-red-600 flex items-center gap-2"
            >
              <X size={16} />
              Remove Image
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute bottom-2 left-2 right-2 bg-red-500 text-white text-xs p-2 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="absolute top-1 right-1"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Click outside to close options */}
      {showOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
};
