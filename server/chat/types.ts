import { z } from 'zod';
import type { ChatModelKey } from '../../constants/chatModels.js';
import {
  MAX_REQUEST_MESSAGES,
  MAX_REQUEST_MESSAGE_TEXT_LENGTH,
  MAX_REQUEST_TOTAL_TEXT_LENGTH,
} from './constants.js';

const PAYLOAD_LIMIT_EXCEEDED_CODE = 'PAYLOAD_LIMIT_EXCEEDED';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getTextLengthFromArray = (value: unknown[]): number => {
  let length = 0;

  for (const part of value) {
    if (typeof part === 'string') {
      length += part.length;
      continue;
    }

    if (
      isRecord(part) &&
      part.type === 'text' &&
      typeof part.text === 'string'
    ) {
      length += part.text.length;
    }
  }

  return length;
};

const getMessageTextLength = (message: Record<string, unknown>): number => {
  if (Array.isArray(message.parts)) {
    return getTextLengthFromArray(message.parts);
  }

  if (typeof message.content === 'string') {
    return message.content.length;
  }

  if (Array.isArray(message.content)) {
    return getTextLengthFromArray(message.content);
  }

  if (typeof message.text === 'string') {
    return message.text.length;
  }

  return 0;
};

const ChatMessagesSchema = z
  .array(z.record(z.string(), z.unknown()))
  .min(1, 'At least one message is required.')
  .max(
    MAX_REQUEST_MESSAGES,
    `Too many messages. Maximum ${MAX_REQUEST_MESSAGES} messages are allowed.`,
  )
  .superRefine((messages, ctx) => {
    let totalTextLength = 0;

    messages.forEach((message, index) => {
      const messageTextLength = getMessageTextLength(message);
      totalTextLength += messageTextLength;

      if (messageTextLength > MAX_REQUEST_MESSAGE_TEXT_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: `Message ${index + 1} exceeds ${MAX_REQUEST_MESSAGE_TEXT_LENGTH} characters.`,
          params: {
            code: PAYLOAD_LIMIT_EXCEEDED_CODE,
          },
        });
      }
    });

    if (totalTextLength > MAX_REQUEST_TOTAL_TEXT_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total message text exceeds ${MAX_REQUEST_TOTAL_TEXT_LENGTH} characters.`,
        params: {
          code: PAYLOAD_LIMIT_EXCEEDED_CODE,
        },
      });
    }
  });

export const ChatRequestSchema = z.object({
  messages: ChatMessagesSchema,
  model: z.string().optional(),
  mode: z.enum(['academic', 'general']).optional(),
  allowPaidFallback: z.boolean().optional(),
});

export type ChatRequestBody = z.infer<typeof ChatRequestSchema>;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export interface ResolvedModelResult {
  key: ChatModelKey;
  modelId: string;
}

export interface SafeErrorMeta {
  name?: string;
  message?: string;
  statusCode?: number;
  providerCode?: string | number;
}

export interface ChatMessageMetadata {
  requestedModelKey: ChatModelKey;
  requestedModelId: string;
  resolvedModelId?: string;
  responseModelId?: string;
  paidFallbackApplied?: boolean;
}
