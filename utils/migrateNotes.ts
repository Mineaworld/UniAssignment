import type { NotesContent } from '../types';

/**
 * Migrates plain text description to BlockNote format.
 * Used for backward compatibility with existing assignments.
 */
export function migrateDescriptionToNotes(
  description?: string
): NotesContent | undefined {
  if (!description?.trim()) return undefined;

  // Split by double newlines for paragraphs
  const paragraphs = description.split(/\n\n+/);

  return {
    version: 1,
    blocks: paragraphs.map((text, index) => ({
      id: `migrated-${index}-${Date.now()}`,
      type: 'paragraph' as const,
      props: {
        textColor: 'default' as const,
        backgroundColor: 'default' as const,
        textAlignment: 'left' as const,
      },
      content: [{ type: 'text' as const, text: text.trim(), styles: {} }],
      children: [],
    })),
  };
}

/**
 * Gets notes content, falling back to migrated description if needed.
 */
export function getNotesContent(
  notes?: NotesContent,
  description?: string
): NotesContent | undefined {
  return notes || migrateDescriptionToNotes(description);
}
