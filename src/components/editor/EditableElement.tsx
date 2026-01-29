/**
 * Universal Editable Element Wrapper
 * Makes any element editable by wrapping it
 */

import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { Pencil } from 'lucide-react';

interface EditableElementProps {
  children: React.ReactNode;
  onSave: (newValue: string) => Promise<void>;
  value: string;
  tag?: keyof JSX.IntrinsicElements;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  preserveFormatting?: boolean; // Preserve HTML/formatting
}

export const EditableElement: React.FC<EditableElementProps> = ({
  children,
  onSave,
  value,
  tag = 'div',
  className = '',
  multiline = false,
  placeholder = 'Click to edit...',
  preserveFormatting = false,
}) => {
  const { isEditing } = useEditor();
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLDivElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditingContent && inputRef.current) {
      inputRef.current.focus();
      if (preserveFormatting && inputRef.current instanceof HTMLDivElement) {
        // Select all text in contentEditable
        const range = document.createRange();
        range.selectNodeContents(inputRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      } else if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      }
    }
  }, [isEditingContent, preserveFormatting]);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing && !isEditingContent) {
      e.stopPropagation();
      setIsEditingContent(true);
    }
  };

  const handleBlur = async () => {
    const finalValue = preserveFormatting && inputRef.current instanceof HTMLDivElement
      ? inputRef.current.innerHTML
      : editValue;

    if (finalValue !== value) {
      setIsSaving(true);
      try {
        await onSave(finalValue);
      } catch (error) {
        console.error('Error saving content:', error);
        setEditValue(value); // Revert on error
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditingContent(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !preserveFormatting) {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditingContent(false);
      inputRef.current?.blur();
    }
  };

  const Tag = tag as keyof JSX.IntrinsicElements;

  if (!isEditing) {
    return <Tag className={className}>{children}</Tag>;
  }

  if (isEditingContent) {
    if (preserveFormatting) {
      return (
        <div className="relative">
          <div
            ref={inputRef as React.RefObject<HTMLDivElement>}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`${className} ${isSaving ? 'opacity-50' : ''} bg-yellow-50 border-2 border-blue-500 rounded px-2 py-1 outline-none min-h-[2rem]`}
            dangerouslySetInnerHTML={{ __html: editValue }}
          />
          {isSaving && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              Saving...
            </span>
          )}
        </div>
      );
    }

    const InputComponent = multiline ? 'textarea' : 'input';
    return (
      <div className="relative">
        <InputComponent
          ref={inputRef as any}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`${className} ${isSaving ? 'opacity-50' : ''} bg-yellow-50 border-2 border-blue-500 rounded px-2 py-1 outline-none`}
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

  return (
    <Tag
      className={`${className} ${isEditing ? 'cursor-text hover:bg-yellow-50 px-2 py-1 rounded transition-colors group relative' : ''}`}
      onClick={handleClick}
    >
      {children}
      {isEditing && (
        <Pencil 
          size={14} 
          className="inline-block ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" 
        />
      )}
    </Tag>
  );
};

