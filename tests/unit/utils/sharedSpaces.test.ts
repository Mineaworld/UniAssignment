import { describe, expect, it } from 'vitest';
import { buildShareLink, createSharedAssignmentId, parseSharedAssignmentId } from '../../../utils/sharedSpaces';

describe('sharedSpaces utils', () => {
  it('builds and parses shared assignment identifiers', () => {
    const id = createSharedAssignmentId('space-123', 'assignment-456');

    expect(id).toBe('shared::space-123::assignment-456');
    expect(parseSharedAssignmentId(id)).toEqual({
      assignmentId: 'assignment-456',
      spaceId: 'space-123',
    });
  });

  it('returns null for invalid shared assignment identifiers', () => {
    expect(parseSharedAssignmentId('assignment-456')).toBeNull();
    expect(parseSharedAssignmentId('shared::space-123')).toBeNull();
  });

  it('builds a share link for the current app origin', () => {
    expect(buildShareLink('invite-123')).toMatch(/\/join\/invite-123$/);
  });
});
