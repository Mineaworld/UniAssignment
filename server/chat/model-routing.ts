import {
  CHAT_MODEL_BY_KEY,
  DEFAULT_CHAT_MODEL_KEY,
  type ChatModelKey,
} from '../../constants/chatModels.js';
import {
  MAX_HISTORY_MESSAGES,
  MODEL_CATALOG_CHECK_ENABLED,
  MODEL_CATALOG_TIMEOUT_MS,
  MODELS_CACHE_TTL_MS,
  PAID_FALLBACK_MODEL_IDS,
} from './constants.js';
import { toSafeErrorMeta } from './error-utils.js';
import { logChatEvent } from './logging.js';
import type { ResolvedModelResult } from './types.js';

let availableModelsCache:
  | {
      ids: Set<string>;
      expiresAt: number;
    }
  | null = null;

const getCandidateModelKeys = (requestedKey: ChatModelKey): ChatModelKey[] => {
  const allModelKeys = Object.keys(CHAT_MODEL_BY_KEY) as ChatModelKey[];
  const candidates = [requestedKey, DEFAULT_CHAT_MODEL_KEY, ...allModelKeys];

  return candidates.filter((key, index) => candidates.indexOf(key) === index);
};

const rotateModelIds = (modelIds: readonly string[], offset: number): string[] => {
  if (modelIds.length === 0) {
    return [];
  }

  const safeOffset = ((offset % modelIds.length) + modelIds.length) % modelIds.length;
  return modelIds.slice(safeOffset).concat(modelIds.slice(0, safeOffset));
};

export const getRotatedPaidFallbackModelIds = (uidHash: string): string[] => {
  const parsedHashPrefix = Number.parseInt(uidHash.slice(0, 8), 16);
  const stableHashValue = Number.isFinite(parsedHashPrefix) ? parsedHashPrefix : 0;
  const fiveMinuteWindow = Math.floor(Date.now() / (5 * 60 * 1000));
  const offset = (stableHashValue + fiveMinuteWindow) % PAID_FALLBACK_MODEL_IDS.length;

  return rotateModelIds(PAID_FALLBACK_MODEL_IDS, offset);
};

export const isPaidFallbackModelId = (modelId: string): boolean =>
  PAID_FALLBACK_MODEL_IDS.includes(modelId as (typeof PAID_FALLBACK_MODEL_IDS)[number]);

const fetchAvailableOpenRouterModelIds = async (
  apiKey: string,
): Promise<Set<string> | null> => {
  const now = Date.now();
  if (availableModelsCache && availableModelsCache.expiresAt > now) {
    return availableModelsCache.ids;
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), MODEL_CATALOG_TIMEOUT_MS);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: abortController.signal,
    });

    if (!response.ok) {
      logChatEvent('warn', 'model_catalog_http_error', {
        statusCode: response.status,
      });
      return null;
    }

    const payload = (await response.json()) as {
      data?: Array<{
        id?: unknown;
      }>;
    };

    const modelIds = new Set<string>();
    for (const model of payload.data ?? []) {
      if (typeof model.id === 'string' && model.id.length > 0) {
        modelIds.add(model.id);
      }
    }

    availableModelsCache = {
      ids: modelIds,
      expiresAt: now + MODELS_CACHE_TTL_MS,
    };

    return modelIds;
  } catch (error) {
    logChatEvent('warn', 'model_catalog_fetch_failed', {
      error: toSafeErrorMeta(error),
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export const resolveModel = async (
  requestedKey: ChatModelKey,
  openRouterApiKey: string,
): Promise<ResolvedModelResult> => {
  const requestedModel = CHAT_MODEL_BY_KEY[requestedKey];

  // Speed-first default: avoid a preflight model catalog request on every cache miss.
  if (!MODEL_CATALOG_CHECK_ENABLED) {
    return {
      key: requestedKey,
      modelId: requestedModel.modelId,
    };
  }

  const availableModelIds = await fetchAvailableOpenRouterModelIds(openRouterApiKey);

  if (!availableModelIds) {
    return {
      key: requestedKey,
      modelId: requestedModel.modelId,
    };
  }

  if (availableModelIds.has(requestedModel.modelId)) {
    return {
      key: requestedKey,
      modelId: requestedModel.modelId,
    };
  }

  for (const candidateKey of getCandidateModelKeys(requestedKey)) {
    const candidateModel = CHAT_MODEL_BY_KEY[candidateKey];
    if (availableModelIds.has(candidateModel.modelId)) {
      return {
        key: candidateKey,
        modelId: candidateModel.modelId,
      };
    }
  }

  return {
    key: requestedKey,
    modelId: requestedModel.modelId,
  };
};

export const trimMessageHistory = (messages: Array<Record<string, unknown>>) =>
  messages.slice(-MAX_HISTORY_MESSAGES);
