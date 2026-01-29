/**
 * Editable Color Component
 * Allows editing color values (background, text, border, etc.)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { Palette, Check } from 'lucide-react';

interface EditableColorProps {
  value: string; // CSS color value (hex, rgb, etc.)
  onSave: (newValue: string) => Promise<void>;
  type?: 'text' | 'background' | 'border';
  className?: string;
  style?: React.CSSProperties;
}

export const EditableColor: React.FC<EditableColorProps> = ({
  value,
  onSave,
  type = 'text',
  className = '',
  style = {},
}) => {
  const { isEditing } = useEditor();
  const [isEditingColor, setIsEditingColor] = useState(false);
  const [colorValue, setColorValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setColorValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditingColor && colorInputRef.current) {
      colorInputRef.current.focus();
    }
  }, [isEditingColor]);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing && !isEditingColor) {
      e.stopPropagation();
      setIsEditingColor(true);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColorValue(e.target.value);
  };

  const handleBlur = async () => {
    if (colorValue !== value) {
      setIsSaving(true);
      try {
        await onSave(colorValue);
      } catch (error) {
        console.error('Error saving color:', error);
        setColorValue(value); // Revert on error
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditingColor(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      colorInputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setColorValue(value);
      setIsEditingColor(false);
    }
  };

  // Apply color based on type
  const colorStyle: React.CSSProperties = {
    ...style,
    ...(type === 'text' && { color: colorValue }),
    ...(type === 'background' && { backgroundColor: colorValue }),
    ...(type === 'border' && { borderColor: colorValue }),
  };

  if (!isEditing) {
    return <span className={className} style={colorStyle} />;
  }

  if (isEditingColor) {
    return (
      <div className="relative inline-flex items-center gap-2">
        <input
          ref={colorInputRef}
          type="color"
          value={colorValue}
          onChange={handleColorChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-12 h-8 rounded border-2 border-blue-500 cursor-pointer"
          style={{ opacity: isSaving ? 0.5 : 1 }}
        />
        <input
          type="text"
          value={colorValue}
          onChange={(e) => setColorValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="px-2 py-1 border border-gray-300 rounded text-sm w-24"
          placeholder="#000000"
        />
        {isSaving && (
          <span className="text-xs text-gray-500">Saving...</span>
        )}
      </div>
    );
  }

  return (
    <span
      className={`${className} ${isEditing ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 rounded px-1 transition-all group relative' : ''}`}
      style={colorStyle}
      onClick={handleClick}
      title={isEditing ? 'Click to edit color' : ''}
    >
      {isEditing && (
        <Palette 
          size={12} 
          className="inline-block ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" 
        />
      )}
    </span>
  );
};

