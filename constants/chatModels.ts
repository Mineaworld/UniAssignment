export interface ChatModelConfig {
  key: string;
  label: string;
  modelId: string;
  description: string;
  isFastRecommended?: boolean;
}

export const CHAT_MODELS = [
  {
    key: 'glm-4.5-air-free',
    label: 'GLM 4.5 Air (Free)',
    modelId: 'z-ai/glm-4.5-air:free',
    description: 'Fast general-purpose assistant',
    isFastRecommended: false,
  },
  {
    key: 'llama-3.3-70b-free',
    label: 'Llama 3.3 70B (Free)',
    modelId: 'meta-llama/llama-3.3-70b-instruct:free',
    description: 'High-quality instruction following',
    isFastRecommended: false,
  },
  {
    key: 'gpt-oss-20b-free',
    label: 'GPT-OSS 20B (Free)',
    modelId: 'openai/gpt-oss-20b:free',
    description: 'Fast and capable open model for factual Q&A',
    isFastRecommended: false,
  },
  {
    key: 'gemma-3-27b-free',
    label: 'Gemma 3 27B (Free)',
    modelId: 'google/gemma-3-27b-it:free',
    description: 'Balanced quality and multilingual support',
    isFastRecommended: true,
  },
] as const satisfies readonly ChatModelConfig[];

export type ChatModelKey = (typeof CHAT_MODELS)[number]['key'];

export const FASTEST_RECOMMENDED_MODEL_KEY: ChatModelKey = 'gemma-3-27b-free';

export const DEFAULT_CHAT_MODEL_KEY: ChatModelKey = 'glm-4.5-air-free';

export const CHAT_MODEL_BY_KEY: Record<ChatModelKey, (typeof CHAT_MODELS)[number]> =
  Object.fromEntries(CHAT_MODELS.map((model) => [model.key, model])) as Record<
    ChatModelKey,
    (typeof CHAT_MODELS)[number]
  >;

const PAID_FALLBACK_MODEL_LABEL_BY_ID: Record<string, string> = {
  'openai/gpt-oss-20b': 'GPT-OSS 20B (Paid)',
  'google/gemma-3-12b-it': 'Gemma 3 12B (Paid)',
  'mistralai/mistral-small-3.1-24b-instruct': 'Mistral Small 3.1 24B (Paid)',
};

export const getChatModelLabelById = (modelId: string): string => {
  const configuredFreeModel = CHAT_MODELS.find((model) => model.modelId === modelId);
  if (configuredFreeModel) {
    return configuredFreeModel.label;
  }

  return PAID_FALLBACK_MODEL_LABEL_BY_ID[modelId] ?? modelId;
};

export const CHAT_MODES = [
  {
    key: 'academic',
    label: 'Academic Assistant',
    description: 'Explains concepts and helps with study-focused tasks',
  },
  {
    key: 'general',
    label: 'General Chat',
    description: 'No academic system prompt applied',
  },
] as const;

export type ChatMode = (typeof CHAT_MODES)[number]['key'];

export const SYSTEM_PROMPTS: Record<ChatMode, string | null> = {
  academic:
    'You are an academic assistant helping university students with assignments, studying, and explanations. Be helpful, clear, and educational.',
  general: null,
};
