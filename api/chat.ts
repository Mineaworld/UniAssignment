import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  convertToModelMessages,
  safeValidateUIMessages,
  streamText,
  type UIMessage,
} from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { admin } from "./lib/firebaseAdmin.js";
import {
  CHAT_MODEL_BY_KEY,
  DEFAULT_CHAT_MODEL_KEY,
  SYSTEM_PROMPTS,
  type ChatMode,
  type ChatModelKey,
} from "../constants/chatModels.js";
import {
  MAX_OUTPUT_TOKENS,
  OPENROUTER_POLICY_SETTINGS_URL,
} from "./chat/constants.js";
import {
  getUserFacingStreamErrorMessage,
  isOpenRouterPolicyBlockedError,
  toSafeErrorMeta,
} from "./chat/error-utils.js";
import { logChatEvent, hashUserId } from "./chat/logging.js";
import {
  getRotatedPaidFallbackModelIds,
  isPaidFallbackModelId,
  resolveModel,
  trimMessageHistory,
} from "./chat/model-routing.js";
import {
  incrementAndCheckRateLimit,
  setRateLimitHeaders,
} from "./chat/rate-limit.js";
import {
  ChatRequestValidationError,
  getBearerToken,
  parseRequestBody,
} from "./chat/request.js";
import { normalizeUIMessages } from "./chat/messages.js";
import type { ChatMessageMetadata, ChatRequestBody } from "./chat/types.js";

const isModelKey = (value: string): value is ChatModelKey =>
  Object.hasOwn(CHAT_MODEL_BY_KEY, value);

const toModelInputMessages = (
  messages: UIMessage[],
): Array<Omit<UIMessage, "id">> =>
  messages.map((message) => {
    const { id: _id, ...rest } = message;
    return rest;
  });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestIdHeader = req.headers["x-vercel-id"];
  const requestId = Array.isArray(requestIdHeader)
    ? (requestIdHeader[0] ?? "local")
    : (requestIdHeader ?? "local");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res
      .status(500)
      .json({ error: "OPENROUTER_API_KEY is not configured" });
  }

  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let uid: string;
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    uid = decodedToken.uid;
  } catch (error) {
    logChatEvent("warn", "auth_token_verification_failed", {
      requestId,
      error: toSafeErrorMeta(error),
    });
    return res.status(401).json({ error: "Invalid auth token" });
  }
  const uidHash = hashUserId(uid);

  let parsedBody: ChatRequestBody;
  try {
    parsedBody = parseRequestBody(req);
  } catch (error) {
    if (error instanceof ChatRequestValidationError) {
      return res.status(400).json({
        error: error.message,
        code: error.code,
      });
    }

    return res.status(400).json({
      error: "Invalid request body",
      code: "INVALID_REQUEST_BODY",
    });
  }

  const historyWindow = trimMessageHistory(parsedBody.messages);
  const normalizedMessages = normalizeUIMessages(historyWindow);

  if (normalizedMessages.length === 0) {
    logChatEvent("warn", "chat_invalid_messages", {
      requestId,
      uidHash,
      reason: "no_valid_messages_after_normalization",
    });
    return res.status(400).json({
      error: "Invalid message format. Please retry or start a new chat.",
      code: "INVALID_MESSAGES",
    });
  }

  const validationResult = await safeValidateUIMessages({
    messages: normalizedMessages as unknown as UIMessage[],
  });

  if (!validationResult.success) {
    logChatEvent("warn", "chat_invalid_messages", {
      requestId,
      uidHash,
      reason: "safe_validate_failed",
      error: toSafeErrorMeta(validationResult.error),
    });
    return res.status(400).json({
      error: "Invalid message format. Please retry or start a new chat.",
      code: "INVALID_MESSAGES",
    });
  }

  const rateLimit = await incrementAndCheckRateLimit(uid);
  setRateLimitHeaders(res, rateLimit);

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      code: "RATE_LIMIT_EXCEEDED",
      resetAt: rateLimit.resetAt.toISOString(),
    });
  }

  const requestedModelKeyValue = parsedBody.model ?? DEFAULT_CHAT_MODEL_KEY;
  const requestedModelKey: ChatModelKey = isModelKey(requestedModelKeyValue)
    ? requestedModelKeyValue
    : DEFAULT_CHAT_MODEL_KEY;
  const requestedModelId = CHAT_MODEL_BY_KEY[requestedModelKey].modelId;
  const mode: ChatMode = parsedBody.mode ?? "academic";
  const allowPaidFallback = parsedBody.allowPaidFallback === true;
  const resolvedModel = await resolveModel(
    requestedModelKey,
    process.env.OPENROUTER_API_KEY,
  );
  const isFallbackModel = resolvedModel.key !== requestedModelKey;
  const shouldUsePaidFallbackModels =
    allowPaidFallback && resolvedModel.modelId.endsWith(":free");
  const paidFallbackModelIds = shouldUsePaidFallbackModels
    ? getRotatedPaidFallbackModelIds(uidHash)
    : [];

  if (isFallbackModel) {
    logChatEvent("warn", "model_fallback_applied", {
      requestId,
      uidHash,
      requestedModelKey,
      resolvedModelKey: resolvedModel.key,
      resolvedModelId: resolvedModel.modelId,
    });
  }

  const headers: Record<string, string> = {};
  if (process.env.OPENROUTER_HTTP_REFERER) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_HTTP_REFERER;
  }
  if (process.env.OPENROUTER_X_TITLE) {
    headers["X-Title"] = process.env.OPENROUTER_X_TITLE;
  }

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });

  try {
    const modelMessages = await convertToModelMessages(
      toModelInputMessages(validationResult.data),
    );
    let responseModelId: string | undefined;
    let paidFallbackApplied = false;

    const stream = streamText({
      model: openrouter(resolvedModel.modelId, {
        user: uid,
        models: shouldUsePaidFallbackModels ? paidFallbackModelIds : undefined,
        provider: {
          sort: "throughput",
          allow_fallbacks: true,
        },
      }),
      messages: modelMessages,
      system: SYSTEM_PROMPTS[mode] ?? undefined,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      maxRetries: 1,
      onStepFinish: (stepResult) => {
        responseModelId = stepResult.response.modelId;
        paidFallbackApplied =
          shouldUsePaidFallbackModels &&
          responseModelId !== resolvedModel.modelId &&
          isPaidFallbackModelId(responseModelId);

        if (paidFallbackApplied) {
          logChatEvent("info", "paid_fallback_used", {
            requestId,
            uidHash,
            requestedModelId,
            resolvedModelId: resolvedModel.modelId,
            responseModelId,
          });
        }
      },
    });

    return stream.pipeUIMessageStreamToResponse(res, {
      headers: {
        "Cache-Control": "no-store",
        "X-Chat-History-Size": String(validationResult.data.length),
        "X-Chat-Model-Requested": requestedModelKey,
        "X-Chat-Model-Resolved": resolvedModel.modelId,
        "X-Chat-Model-Fallback": String(isFallbackModel),
      },
      messageMetadata: ({ part }): ChatMessageMetadata | undefined => {
        if (part.type === "start") {
          return {
            requestedModelKey,
            requestedModelId,
            resolvedModelId: resolvedModel.modelId,
          };
        }

        if (part.type === "finish") {
          return {
            requestedModelKey,
            requestedModelId,
            resolvedModelId: resolvedModel.modelId,
            responseModelId,
            paidFallbackApplied,
          };
        }

        return undefined;
      },
      onError: (error) => {
        const safeErrorMeta = toSafeErrorMeta(error);
        logChatEvent("error", "chat_stream_error", {
          requestId,
          uidHash,
          requestedModelKey,
          resolvedModelId: resolvedModel.modelId,
          fallbackApplied: isFallbackModel,
          error: safeErrorMeta,
        });
        return getUserFacingStreamErrorMessage(safeErrorMeta, requestId);
      },
    });
  } catch (error) {
    const safeErrorMeta = toSafeErrorMeta(error);
    logChatEvent("error", "chat_api_failure", {
      requestId,
      uidHash,
      requestedModelKey,
      resolvedModelId: resolvedModel.modelId,
      fallbackApplied: isFallbackModel,
      error: safeErrorMeta,
    });

    if (isOpenRouterPolicyBlockedError(safeErrorMeta)) {
      return res.status(400).json({
        error:
          "OpenRouter policy is blocking free models. Update privacy settings to allow free model publication.",
        code: "OPENROUTER_POLICY_BLOCKED",
        settingsUrl: OPENROUTER_POLICY_SETTINGS_URL,
      });
    }

    return res.status(500).json({
      error: "Failed to generate response",
      code: "CHAT_GENERATION_FAILED",
    });
  }
}
