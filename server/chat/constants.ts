const toPositiveInt = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
};

export const RATE_LIMIT_MAX_MESSAGES =
  toPositiveInt(process.env.CHAT_RATE_LIMIT_MAX_MESSAGES) ?? 30;
export const RATE_LIMIT_WINDOW_MS =
  toPositiveInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS) ?? 60 * 60 * 1000;
export const MODELS_CACHE_TTL_MS = 15 * 60 * 1000;
export const MODEL_CATALOG_TIMEOUT_MS = 800;
export const MAX_HISTORY_MESSAGES = 8;
export const MAX_OUTPUT_TOKENS = 900;
export const MAX_MESSAGE_TEXT_LENGTH = 256;
export const MAX_REQUEST_MESSAGES = 20;
export const MAX_REQUEST_MESSAGE_TEXT_LENGTH = 4_000;
export const MAX_REQUEST_TOTAL_TEXT_LENGTH = 12_000;
export const MODEL_CATALOG_CHECK_ENABLED =
  process.env.OPENROUTER_ENABLE_MODEL_CATALOG_CHECK === 'true';

export const PAID_FALLBACK_MODEL_IDS = [
  'openai/gpt-oss-20b',
  'google/gemma-3-12b-it',
  'mistralai/mistral-small-3.1-24b-instruct',
] as const;

export const OPENROUTER_POLICY_BLOCKED_HINT =
  'No endpoints found matching your data policy';
export const OPENROUTER_POLICY_SETTINGS_URL = 'https://openrouter.ai/settings/privacy';
