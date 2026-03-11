import { getFriendlyChatErrorMessage } from '../../../utils/chatError';
import { describe, expect, it } from 'vitest';

describe('getFriendlyChatErrorMessage', () => {
  it('returns parsed JSON error messages', () => {
    const message = getFriendlyChatErrorMessage('{"error":"Provider unavailable"}');

    expect(message).toBe('Provider unavailable');
  });

  it('maps OpenRouter free-model policy errors to friendly guidance', () => {
    const policyMessage = getFriendlyChatErrorMessage(
      'No endpoints found matching your data policy'
    );

    expect(policyMessage).toContain('OpenRouter policy is blocking free models');
  });

  it('maps provider transient failures to retry message', () => {
    const transientMessage = getFriendlyChatErrorMessage(
      'Failed after 3 attempts: Provider returned error'
    );

    expect(transientMessage).toBe(
      'Selected model provider is temporarily unavailable. Please retry or switch model.'
    );
  });

  it('falls back to trimmed raw text for unknown messages', () => {
    const raw = getFriendlyChatErrorMessage('  something else happened  ');

    expect(raw).toBe('something else happened');
  });
});
