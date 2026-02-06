import {
  MAX_MESSAGE_TEXT_LENGTH,
  OPENROUTER_POLICY_BLOCKED_HINT,
  OPENROUTER_POLICY_SETTINGS_URL,
} from './constants.js';
import type { SafeErrorMeta } from './types.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const truncateText = (value: string, maxLength = MAX_MESSAGE_TEXT_LENGTH): string =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

const normalizeNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const isGenericRetryWrapperMessage = (value: string): boolean => {
  const normalized = value.toLowerCase();

  return (
    normalized.includes('failed after') &&
    (normalized.includes('provider returned error') ||
      normalized.includes('last error'))
  );
};

const isGenericProviderMessage = (value: string): boolean => {
  const normalized = value.toLowerCase();

  return (
    normalized === 'provider returned error' ||
    normalized.includes('failed to process successful response')
  );
};

const getMessageFromParsedErrorBody = (value: unknown): string | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  if (typeof value.error === 'string') {
    return normalizeNonEmptyString(value.error);
  }

  if (isRecord(value.error)) {
    const providerMessage =
      normalizeNonEmptyString(value.error.message) ??
      normalizeNonEmptyString(value.error.raw) ??
      normalizeNonEmptyString(value.error.detail);

    if (providerMessage) {
      return providerMessage;
    }

    if (isRecord(value.error.metadata)) {
      const metadataMessage =
        normalizeNonEmptyString(value.error.metadata.raw) ??
        normalizeNonEmptyString(value.error.metadata.reason) ??
        normalizeNonEmptyString(value.error.metadata.provider_error) ??
        normalizeNonEmptyString(value.error.metadata.upstream_error);

      if (metadataMessage) {
        return metadataMessage;
      }
    }
  }

  const topLevelMessage =
    normalizeNonEmptyString(value.message) ??
    normalizeNonEmptyString(value.detail);

  if (topLevelMessage) {
    return topLevelMessage;
  }

  if (Array.isArray(value.errors)) {
    for (const nestedError of value.errors) {
      const nestedMessage = getMessageFromParsedErrorBody(nestedError);
      if (nestedMessage) {
        return nestedMessage;
      }
    }
  }

  return undefined;
};

interface ExtractedErrorDetails {
  message?: string;
  statusCode?: number;
  providerCode?: string | number;
}

const mergeErrorDetails = (
  primary: ExtractedErrorDetails,
  fallback: ExtractedErrorDetails,
): ExtractedErrorDetails => ({
  message: primary.message ?? fallback.message,
  statusCode: primary.statusCode ?? fallback.statusCode,
  providerCode: primary.providerCode ?? fallback.providerCode,
});

const extractErrorDetails = (
  error: unknown,
  seen: Set<unknown> = new Set(),
): ExtractedErrorDetails => {
  if (!isRecord(error)) {
    if (error instanceof Error) {
      const message = normalizeNonEmptyString(error.message);
      return message ? { message } : {};
    }
    return {};
  }

  if (seen.has(error)) {
    return {};
  }
  seen.add(error);

  let extracted: ExtractedErrorDetails = {};

  if (typeof error.statusCode === 'number') {
    extracted.statusCode = error.statusCode;
  }

  if (isRecord(error.data) && isRecord(error.data.error)) {
    const providerMessage =
      normalizeNonEmptyString(error.data.error.message) ??
      normalizeNonEmptyString(error.data.error.raw);
    if (providerMessage) {
      extracted.message = providerMessage;
    }

    const providerCode = error.data.error.code;
    if (typeof providerCode === 'string' || typeof providerCode === 'number') {
      extracted.providerCode = providerCode;
    }
  }

  if (!extracted.message && typeof error.responseBody === 'string') {
    try {
      const parsed = JSON.parse(error.responseBody) as unknown;
      const responseBodyMessage = getMessageFromParsedErrorBody(parsed);
      if (responseBodyMessage) {
        extracted.message = responseBodyMessage;
      }
    } catch {
      // ignore malformed JSON response body
    }
  }

  const directMessage = normalizeNonEmptyString(error.message);
  if (
    directMessage &&
    !extracted.message &&
    !isGenericRetryWrapperMessage(directMessage) &&
    !isGenericProviderMessage(directMessage)
  ) {
    extracted.message = directMessage;
  }

  if (isRecord(error.lastError)) {
    extracted = mergeErrorDetails(extracted, extractErrorDetails(error.lastError, seen));
  }

  if (isRecord(error.cause)) {
    extracted = mergeErrorDetails(extracted, extractErrorDetails(error.cause, seen));
  }

  if (Array.isArray(error.errors)) {
    for (let index = error.errors.length - 1; index >= 0; index -= 1) {
      const nestedError = error.errors[index];
      extracted = mergeErrorDetails(extracted, extractErrorDetails(nestedError, seen));
      if (extracted.message && extracted.statusCode !== undefined) {
        break;
      }
    }
  }

  if (!extracted.message && directMessage) {
    extracted.message = directMessage;
  }

  return extracted;
};

export const toSafeErrorMeta = (error: unknown): SafeErrorMeta => {
  if (!isRecord(error) && !(error instanceof Error)) {
    return {};
  }

  const name =
    isRecord(error) && typeof error.name === 'string'
      ? error.name
      : error instanceof Error
        ? error.name
        : undefined;
  const details = extractErrorDetails(error);

  return {
    name,
    message: details.message ? truncateText(details.message) : undefined,
    statusCode: details.statusCode,
    providerCode: details.providerCode,
  };
};

export const isOpenRouterPolicyBlockedError = (errorMeta: SafeErrorMeta): boolean =>
  typeof errorMeta.message === 'string' &&
  errorMeta.message.includes(OPENROUTER_POLICY_BLOCKED_HINT);

export const getUserFacingStreamErrorMessage = (
  errorMeta: SafeErrorMeta,
  requestId: string,
): string => {
  if (
    errorMeta.name === 'AbortError' ||
    (typeof errorMeta.message === 'string' &&
      errorMeta.message.toLowerCase().includes('aborted'))
  ) {
    return 'Request was interrupted before completion. Tap Continue to resume.';
  }

  if (isOpenRouterPolicyBlockedError(errorMeta)) {
    return `OpenRouter policy is blocking free models. Update your settings at ${OPENROUTER_POLICY_SETTINGS_URL}.`;
  }

  if (
    errorMeta.statusCode === 404 &&
    typeof errorMeta.message === 'string' &&
    errorMeta.message.includes('No endpoints found')
  ) {
    return 'Selected model is currently unavailable on OpenRouter. Try again or switch model.';
  }

  if (errorMeta.statusCode === 401) {
    return 'OpenRouter authentication failed. Check OPENROUTER_API_KEY.';
  }

  if (errorMeta.statusCode === 402) {
    return 'OpenRouter account has insufficient credits or billing is required.';
  }

  if (errorMeta.statusCode === 429) {
    return 'OpenRouter is rate limiting requests right now. Please retry in a few seconds.';
  }

  if (
    typeof errorMeta.message === 'string' &&
    errorMeta.message.toLowerCase().includes('rate limit')
  ) {
    return 'OpenRouter is rate limiting requests right now. Please retry in a few seconds.';
  }

  if (
    typeof errorMeta.statusCode === 'number' &&
    errorMeta.statusCode >= 500 &&
    errorMeta.statusCode < 600
  ) {
    return 'OpenRouter provider is temporarily unavailable. Please retry shortly.';
  }

  if (
    typeof errorMeta.message === 'string' &&
    errorMeta.message.toLowerCase().includes('provider returned error')
  ) {
    return 'Selected model provider is temporarily unavailable. Please retry or switch model.';
  }

  if (typeof errorMeta.message === 'string' && errorMeta.message.length > 0) {
    return truncateText(errorMeta.message, 180);
  }

  return `Unable to generate a response right now. (Request: ${requestId})`;
};
