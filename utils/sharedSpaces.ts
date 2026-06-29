const SHARED_ASSIGNMENT_ID_PREFIX = 'shared';
const SHARED_ASSIGNMENT_ID_DELIMITER = '::';
const POST_AUTH_REDIRECT_KEY = 'post-auth-redirect';

export const createSharedAssignmentId = (
  spaceId: string,
  assignmentId: string
): string => `${SHARED_ASSIGNMENT_ID_PREFIX}${SHARED_ASSIGNMENT_ID_DELIMITER}${spaceId}${SHARED_ASSIGNMENT_ID_DELIMITER}${assignmentId}`;

export const parseSharedAssignmentId = (
  id: string
): { spaceId: string; assignmentId: string } | null => {
  const [prefix, spaceId, assignmentId] = id.split(SHARED_ASSIGNMENT_ID_DELIMITER);

  if (
    prefix !== SHARED_ASSIGNMENT_ID_PREFIX ||
    !spaceId ||
    !assignmentId
  ) {
    return null;
  }

  return { spaceId, assignmentId };
};

export const buildShareLink = (inviteId: string): string => {
  if (typeof window === 'undefined') {
    return `/join/${inviteId}`;
  }

  return `${window.location.origin}/join/${inviteId}`;
};

export const rememberPostAuthRedirect = (path: string): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
};

export const consumePostAuthRedirect = (): string | null => {
  if (typeof window === 'undefined') return null;

  const value = window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
  if (!value) return null;

  window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  return value;
};

export const peekPostAuthRedirect = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
};
