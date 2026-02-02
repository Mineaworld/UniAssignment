import React from 'react';
import type { NotesContent } from '../../types';
import { NotesEditor } from './NotesEditor';

interface NotesViewerProps {
  content?: NotesContent;
  className?: string;
  maxHeight?: string;
}

/**
 * Read-only notes display component.
 * Renders BlockNote content without editing capabilities.
 */
export const NotesViewer: React.FC<NotesViewerProps> = ({
  content,
  className = '',
  maxHeight = '300px',
}) => {
  if (!content?.blocks?.length) {
    return (
      <div className="text-muted-foreground text-sm italic py-4">
        No notes added yet.
      </div>
    );
  }

  return (
    <div
      className={`notes-viewer overflow-y-auto custom-scrollbar ${className}`}
      style={{ maxHeight }}
    >
      <NotesEditor
        initialContent={content}
        readOnly={true}
        compact={true}
      />
    </div>
  );
};
