import { createHash } from 'node:crypto';

export const hashUserId = (uid: string): string =>
  createHash('sha256').update(uid).digest('hex').slice(0, 12);

export const logChatEvent = (
  level: 'warn' | 'error' | 'info',
  event: string,
  context: Record<string, unknown>,
): void => {
  const payload = {
    event,
    ...context,
  };

  if (level === 'warn') {
    console.warn('[chat]', payload);
    return;
  }

  if (level === 'error') {
    console.error('[chat]', payload);
    return;
  }

  console.info('[chat]', payload);
};
