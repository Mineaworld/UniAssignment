import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2 } from 'lucide-react';
import type { NotesContent } from '../../types';
import { NotesEditor } from './NotesEditor';

interface NotesFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: NotesContent;
  onSave: (content: NotesContent) => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
  assignmentTitle: string;
}

export const NotesFullscreenModal = ({
  isOpen,
  onClose,
  initialContent,
  onSave,
  uploadImage,
  assignmentTitle,
}: NotesFullscreenModalProps) => {
  const [content, setContent] = useState<NotesContent | undefined>(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync initial content when modal opens
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setHasUnsavedChanges(false);
      setSaveError(null);
    }
  }, [isOpen, initialContent]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleChange = useCallback((newContent: NotesContent) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    setSaveError(null);
  }, []);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!content) return false;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(content);
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save notes');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [content, onSave]);

  const handleClose = useCallback(async () => {
    if (hasUnsavedChanges && content) {
      // Auto-save before closing
      const saved = await handleSave();
      if (!saved) {
        // Save failed - don't close, let user see the error
        return;
      }
    }
    onClose();
  }, [hasUnsavedChanges, content, handleSave, onClose]);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-4 md:inset-8 z-[10000] flex flex-col bg-background dark:bg-[#101622] rounded-2xl shadow-2xl border border-border/20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/20 dark:border-white/10 bg-background/80 dark:bg-[#101622]/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Maximize2 className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">Edit Notes</h2>
                  <p className="text-sm text-muted-foreground truncate max-w-[200px] md:max-w-none">
                    {assignmentTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {saveError && (
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    {saveError}
                  </span>
                )}
                {hasUnsavedChanges && !saveError && (
                  <span className="text-xs text-amber-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    Unsaved
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50 transition-all hover:bg-primary/90"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              <NotesEditor
                initialContent={content}
                onChange={handleChange}
                uploadImage={uploadImage}
                readOnly={false}
                compact={false}
                className="h-full min-h-[400px]"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
