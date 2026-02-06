import type { UIMessage } from 'ai';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isValidRole = (value: unknown): value is UIMessage['role'] =>
  value === 'system' || value === 'user' || value === 'assistant';

const isRecognizedPartType = (value: string): boolean =>
  value === 'text' ||
  value === 'reasoning' ||
  value === 'source-url' ||
  value === 'source-document' ||
  value === 'file' ||
  value === 'step-start' ||
  value === 'dynamic-tool' ||
  value.startsWith('data-') ||
  value.startsWith('tool-');

const normalizePart = (part: unknown): UIMessage['parts'][number] | null => {
  if (typeof part === 'string') {
    const trimmed = part.trim();
    return trimmed.length > 0 ? { type: 'text', text: trimmed } : null;
  }

  if (!isRecord(part)) {
    return null;
  }

  if (typeof part.type === 'string') {
    if (!isRecognizedPartType(part.type)) {
      if (typeof part.text === 'string' && part.text.trim().length > 0) {
        return { type: 'text', text: part.text.trim() };
      }
      return null;
    }

    return part as UIMessage['parts'][number];
  }

  if (typeof part.text === 'string' && part.text.trim().length > 0) {
    return { type: 'text', text: part.text.trim() };
  }

  return null;
};

const normalizePartsFromValue = (value: unknown): UIMessage['parts'] => {
  if (Array.isArray(value)) {
    return value
      .map(normalizePart)
      .filter((part): part is UIMessage['parts'][number] => part !== null);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [{ type: 'text', text: value.trim() }];
  }

  return [];
};

const normalizeMessageParts = (
  message: Record<string, unknown>,
): UIMessage['parts'] => {
  const normalizedParts = normalizePartsFromValue(message.parts);
  if (normalizedParts.length > 0) {
    return normalizedParts;
  }

  const contentParts = normalizePartsFromValue(message.content);
  if (contentParts.length > 0) {
    return contentParts;
  }

  const textParts = normalizePartsFromValue(message.text);
  if (textParts.length > 0) {
    return textParts;
  }

  return [];
};

export const normalizeUIMessages = (
  messages: Array<Record<string, unknown>>,
): UIMessage[] => {
  const idPrefix = Date.now().toString(36);

  return messages
    .map((message, index): UIMessage | null => {
      if (!isRecord(message) || !isValidRole(message.role)) {
        return null;
      }

      const parts = normalizeMessageParts(message);
      if (parts.length === 0) {
        return null;
      }

      const id =
        typeof message.id === 'string' && message.id.length > 0
          ? message.id
          : `${idPrefix}-${index}`;

      return {
        id,
        role: message.role,
        metadata: message.metadata,
        parts,
      };
    })
    .filter((message): message is UIMessage => message !== null);
};
