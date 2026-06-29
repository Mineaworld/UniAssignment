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

export const BlockNoteEditor = ({
  initialContent,
  onChange,
  uploadImage,
  readOnly = false,
  compact = false,
  className = '',
}: BlockNoteEditorProps) => {
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

  // Allow one-click link navigation even for plain pasted URLs or anchors
  const handleClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore clicks on toolbars, popovers, menus, or interactive buttons
    if ((e.target as HTMLElement).closest('.bn-toolbar, .bn-popover, .bn-menu, .bn-side-menu, button, [role="button"]')) {
      return;
    }

    // Ignore if user has selected text (dragging to highlight or select)
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return;
    }

    // Check if clicked directly on an <a> element
    const link = (e.target as HTMLElement).closest('a');
    if (link && link.href) {
      if (link.href.startsWith('http://') || link.href.startsWith('https://') || link.href.startsWith('mailto:')) {
        window.open(link.href, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    // Check if clicked on plain text containing a URL
    let textNode: Node | null = null;
    let offset = 0;

    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
        textNode = range.startContainer;
        offset = range.startOffset;
      }
    } else if ((document as any).caretPositionFromPoint) {
      const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
      if (pos && pos.offsetNode.nodeType === Node.TEXT_NODE) {
        textNode = pos.offsetNode;
        offset = pos.offset;
      }
    }

    if (textNode && textNode.textContent) {
      const text = textNode.textContent;
      const trimmed = text.trim();

      // Regex to match URLs starting with http://, https://, or www.
      const urlRegex = /(?:https?:\/\/|www\.)[^\s<]+[^<.,:;"')\]\s]/ig;
      
      let match;
      while ((match = urlRegex.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        
        // Check if click offset falls within this URL match
        if (offset >= start && offset <= end) {
          let url = match[0];
          if (url.toLowerCase().startsWith('www.')) {
            url = 'https://' + url;
          }
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      // Fallback: if the entire trimmed text node is just a URL
      if (/^(?:https?:\/\/|www\.)[^\s]+$/i.test(trimmed)) {
        let url = trimmed;
        if (url.toLowerCase().startsWith('www.')) {
          url = 'https://' + url;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
    }
  }, []);

  return (
    <div
      onClickCapture={handleClickCapture}
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
