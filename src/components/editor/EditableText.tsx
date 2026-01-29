/**
 * Editable Text Component
 * Makes text editable when in editor mode (Notion-like)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { Pencil } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  placeholder?: string;
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onSave,
  className = '',
  tag = 'p',
  placeholder = 'Click to edit...',
  multiline = false,
}) => {
  const { isEditing } = useEditor();
  const [isEditingText, setIsEditingText] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditingText && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      }
    }
  }, [isEditingText]);

  const handleClick = () => {
    if (isEditing && !isEditingText) {
      setIsEditingText(true);
    }
  };

  const handleBlur = async () => {
    if (editValue !== value) {
      setIsSaving(true);
      try {
        await onSave(editValue);
        // Only update local value if save succeeds
        // The parent component should update the state
      } catch (error) {
        console.error('Error saving text:', error);
        // Revert to original value on error
        setEditValue(value);
        alert('Failed to save changes. Please try again.');
      } finally {
        setIsSaving(false);
        setIsEditingText(false);
      }
    } else {
      setIsEditingText(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditingText(false);
    }
  };

  if (!isEditing) {
    const TagComponent = tag as keyof React.JSX.IntrinsicElements;
    return React.createElement(TagComponent, { className }, value || placeholder);
  }

  if (isEditingText) {
    const InputComponent = multiline ? 'textarea' : 'input';
    
    // For better visibility, use dark text on light background
    // Extract size/weight from className but override color for visibility
    const baseClasses = className
      .replace(/text-\w+/g, '') // Remove text color classes
      .replace(/text-bakery-\w+/g, '') // Remove bakery color classes
      .trim();
    
    return (
      <div className="relative">
        <InputComponent
          ref={inputRef as any}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`${baseClasses} text-gray-900 ${isSaving ? 'opacity-50' : ''} bg-yellow-50 border-2 border-blue-500 rounded px-2 py-1 outline-none`}
          style={{
            minWidth: '200px',
            width: '100%',
          }}
          placeholder={placeholder}
          rows={multiline ? 3 : undefined}
        />
        {isSaving && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            Saving...
          </span>
        )}
      </div>
    );
  }

  const TagComponent = tag as keyof React.JSX.IntrinsicElements;
  return React.createElement(
    TagComponent,
    {
      className: `${className} ${isEditing ? 'cursor-text hover:outline hover:outline-2 hover:outline-blue-500 hover:outline-dashed rounded px-1 transition-all group relative' : ''}`,
      onClick: handleClick,
    },
    value || React.createElement('span', { className: 'text-gray-400 italic' }, placeholder),
    isEditing && React.createElement(Pencil, {
      size: 14,
      className: 'inline-block ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity',
    })
  );
};

