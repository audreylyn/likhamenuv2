/**
 * Utility to make any text node editable
 * Wraps text content with EditableText component
 */

import React from 'react';
import { EditableText } from '../components/editor/EditableText';
import { useEditor } from '../contexts/EditorContext';

/**
 * Higher-order component to make any component's text editable
 */
export function withEditableText<T extends { children?: React.ReactNode; className?: string }>(
  Component: React.ComponentType<T>,
  textFields: Array<{
    prop: keyof T;
    table: string;
    field: string;
    recordId?: string | ((props: T) => string);
    tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
    multiline?: boolean;
  }>
) {
  return (props: T) => {
    const { isEditing, saveField } = useEditor();
    
    // Create editable versions of text fields
    const editableProps = { ...props };
    
    textFields.forEach(({ prop, table, field, recordId, tag = 'p', multiline = false }) => {
      const value = props[prop] as string;
      if (value !== undefined) {
        const recordIdValue = typeof recordId === 'function' ? recordId(props) : recordId;
        
        (editableProps as any)[prop] = isEditing ? (
          <EditableText
            value={value || ''}
            onSave={async (newValue) => {
              await saveField(table, field, newValue, recordIdValue);
            }}
            tag={tag}
            multiline={multiline}
            className={props.className}
          />
        ) : (
          value
        );
      }
    });
    
    return <Component {...editableProps} />;
  };
}

/**
 * Simple wrapper to make any text editable
 */
export function EditableWrapper({
  children,
  value,
  onSave,
  tag = 'span',
  className = '',
  multiline = false,
}: {
  children: React.ReactNode;
  value: string;
  onSave: (newValue: string) => Promise<void>;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  className?: string;
  multiline?: boolean;
}) {
  const { isEditing } = useEditor();
  
  if (!isEditing) {
    const Tag = tag as keyof JSX.IntrinsicElements;
    return <Tag className={className}>{children}</Tag>;
  }
  
  return (
    <EditableText
      value={value}
      onSave={onSave}
      tag={tag}
      className={className}
      multiline={multiline}
    />
  );
}

