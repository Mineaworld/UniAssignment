const FREE_MODEL_POLICY_ERROR = 'No endpoints found matching your data policy';
const FREE_MODEL_PUBLICATION_ERROR = 'Free model publication';
const PROVIDER_RETURNED_ERROR = 'Provider returned error';
const FAILED_AFTER_ATTEMPTS = 'Failed after';

export const getFriendlyChatErrorMessage = (rawMessage: string): string => {
  const trimmed = rawMessage.trim();

  try {
    const parsed = JSON.parse(trimmed) as {
      error?: string;
      code?: string;
      details?: string;
    };

    if (typeof parsed.error === 'string' && parsed.error.length > 0) {
      if (
        parsed.error.includes(FREE_MODEL_POLICY_ERROR) ||
        parsed.error.includes(FREE_MODEL_PUBLICATION_ERROR)
      ) {
        return 'OpenRouter policy is blocking free models. Update privacy settings in OpenRouter to allow free model publication.';
      }
      return parsed.error;
    }
  } catch {
    // fall through to plain text handling
  }

  if (
    trimmed.includes(FREE_MODEL_POLICY_ERROR) ||
    trimmed.includes(FREE_MODEL_PUBLICATION_ERROR)
  ) {
    return 'OpenRouter policy is blocking free models. Update privacy settings in OpenRouter to allow free model publication.';
  }

  if (
    trimmed.includes(PROVIDER_RETURNED_ERROR) ||
    (trimmed.includes(FAILED_AFTER_ATTEMPTS) && trimmed.includes(PROVIDER_RETURNED_ERROR))
  ) {
    return 'Selected model provider is temporarily unavailable. Please retry or switch model.';
  }

  return trimmed;
};
