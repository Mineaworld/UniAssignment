import { ReminderPreset, type Assignment } from '../../../types';
import { prepareAssignmentUpdates } from '../../../utils/assignmentUpdate';
import { describe, expect, it } from 'vitest';

describe('prepareAssignmentUpdates', () => {
  const deleteToken = Symbol('delete');
  const createDeleteToken = () => deleteToken;

  it('resets reminder.sentAt when dueDate/reminder changes and reminder stays enabled', () => {
    const updates: Partial<Assignment> = {
      dueDate: '2026-03-10T12:00:00.000Z',
      reminder: {
        enabled: true,
        preset: ReminderPreset.OneHour,
        sentAt: '2026-03-09T12:00:00.000Z',
      },
    };

    const result = prepareAssignmentUpdates(updates, createDeleteToken);

    expect(result.dueDate).toBe('2026-03-10T12:00:00.000Z');
    expect(result["reminder.enabled"]).toBe(true);
    expect(result["reminder.preset"]).toBe(ReminderPreset.OneHour);
    expect(result["reminder.sentAt"]).toBe(deleteToken);
  });

  it('does not force sentAt reset when reminder is disabled', () => {
    const updates: Partial<Assignment> = {
      dueDate: '2026-03-10T12:00:00.000Z',
      reminder: {
        enabled: false,
        preset: ReminderPreset.OneDay,
        sentAt: '2026-03-09T12:00:00.000Z',
      },
    };

    const result = prepareAssignmentUpdates(updates, createDeleteToken);

    expect(result["reminder.sentAt"]).toBe('2026-03-09T12:00:00.000Z');
  });

  it('maps top-level undefined values to delete tokens', () => {
    const updates: Partial<Assignment> = {
      examType: undefined,
    };

    const result = prepareAssignmentUpdates(updates, createDeleteToken);

    expect(result.examType).toBe(deleteToken);
  });

  it('maps nested reminder undefined values to delete tokens', () => {
    const updates: Partial<Assignment> = {
      reminder: {
        enabled: true,
        preset: ReminderPreset.Custom,
        customTime: undefined,
      },
    };

    const result = prepareAssignmentUpdates(updates, createDeleteToken);

    expect(result["reminder.enabled"]).toBe(true);
    expect(result["reminder.preset"]).toBe(ReminderPreset.Custom);
    expect(result["reminder.customTime"]).toBe(deleteToken);
  });

  it('strips undefined values from nested objects like notes', () => {
    const updates: Partial<Assignment> = {
      notes: {
        version: 1,
        blocks: [
          { id: 'block-1', type: 'paragraph', content: undefined, styles: undefined },
          { id: 'block-2', type: 'heading', content: [{ type: 'text', text: 'Hello' }] },
        ],
      } as unknown as Assignment['notes'],
    };

    const result = prepareAssignmentUpdates(updates, createDeleteToken);

    const notesResult = result.notes as Record<string, unknown>;
    expect(notesResult.version).toBe(1);

    const blocks = notesResult.blocks as Array<Record<string, unknown>>;
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).not.toHaveProperty('content');
    expect(blocks[0]).not.toHaveProperty('styles');
    expect(blocks[0]).toHaveProperty('id', 'block-1');
    expect(blocks[0]).toHaveProperty('type', 'paragraph');
    expect(blocks[1]).toHaveProperty('content');
  });

  it('strips undefined values from nested arrays', () => {
    const updates: Partial<Assignment> = {
      notes: {
        version: 1,
        blocks: [
          { id: 'block-1', type: 'paragraph', children: [undefined, { type: 'text' }] },
        ],
      } as unknown as Assignment['notes'],
    };

    const result = prepareAssignmentUpdates(updates, createDeleteToken);

    const blocks = (result.notes as Record<string, unknown>).blocks as Array<Record<string, unknown>>;
    const children = blocks[0]!.children as Array<unknown>;
    expect(children).toHaveLength(1);
    expect(children[0]).toEqual({ type: 'text' });
  });

  it('preserves null values in nested objects', () => {
    const updates: Partial<Assignment> = {
      subjectSnapshot: {
        name: 'Math',
        color: null as unknown as string,
      } as unknown as Assignment['subjectSnapshot'],
    };

    const result = prepareAssignmentUpdates(updates, createDeleteToken);

    const snapshot = result.subjectSnapshot as Record<string, unknown>;
    expect(snapshot.name).toBe('Math');
    expect(snapshot.color).toBeNull();
  });
});