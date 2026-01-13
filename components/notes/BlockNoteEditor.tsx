import React, { useCallback, useMemo } from 'react';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import type { Block } from '@blocknote/core';
import type { NotesContent } from '../../types';
import { useApp } from '../../context';

interface BlockNoteEditorProps {
  initialContent?: NotesContent;
  onChange?: (content: NotesContent) => void;
  uploadImage?: (file: File) => Promise<string>;
  readOnly?: boolean;
  compact?: boolean;
  className?: string;
}

export const BlockNoteEditor: React.FC<BlockNoteEditorProps> = ({
  initialContent,
  onChange,
  uploadImage,
  readOnly = false,
  compact = false,
  className = '',
}) => {
  const { theme } = useApp();

  // Parse initial blocks from content
  const initialBlocks = useMemo(() => {
    if (!initialContent?.blocks?.length) return undefined;
    return initialContent.blocks as Block[];
  }, [initialContent]);

  // Create editor instance
  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
    uploadFile: uploadImage,
  });

  // Handle content changes
  const handleChange = useCallback(() => {
    if (!onChange || readOnly) return;

    const content: NotesContent = {
      version: 1,
      blocks: editor.document as Block[],
    };
    onChange(content);
  }, [editor, onChange, readOnly]);

  return (
    <div
      className={`
        notes-editor
        ${compact ? 'notes-editor--compact' : ''}
        ${readOnly ? 'notes-editor--readonly' : ''}
        ${className}
      `}
    >
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        theme={theme}
        onChange={handleChange}
        sideMenu={!compact}
      />
    </div>
  );
};
