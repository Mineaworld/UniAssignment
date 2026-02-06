import React, { lazy, Suspense } from 'react';
import type { NotesContent } from '../../types';
import { EditorSkeleton } from './EditorSkeleton';

// Lazy load BlockNote to reduce initial bundle size (~150KB)
const BlockNoteEditor = lazy(() =>
  import('./BlockNoteEditor').then(m => ({ default: m.BlockNoteEditor }))
);

export interface NotesEditorProps {
  initialContent?: NotesContent;
  onChange?: (content: NotesContent) => void;
  uploadImage?: (file: File) => Promise<string>;
  readOnly?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Rich text notes editor with lazy-loaded BlockNote.
 * Supports text formatting, code blocks, images, and lists.
 */
export const NotesEditor = (props: NotesEditorProps) => (
  <Suspense fallback={<EditorSkeleton />}>
    <BlockNoteEditor {...props} />
  </Suspense>
);
