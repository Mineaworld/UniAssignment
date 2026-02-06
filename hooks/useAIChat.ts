import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../firebase';
import { useToast } from '../components/ToastContext';
import { chatMessageMetadataSchema } from '../utils/chatMessageMetadata';
import { CONTINUE_RESPONSE_PROMPT, getContinuationHint } from '../utils/chatStreamRecovery';
import { getFriendlyChatErrorMessage } from '../utils/chatError';
import { DEFAULT_CHAT_MODEL_KEY, type ChatMode, type ChatModelKey } from '../constants/chatModels';

interface UseAIChatOptions {
  defaultModel?: ChatModelKey;
  defaultMode?: ChatMode;
}

const PAID_FALLBACK_STORAGE_KEY = 'ai-chat-allow-paid-fallback';

const getStoredPaidFallbackPreference = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(PAID_FALLBACK_STORAGE_KEY) === 'true';
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

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

const normalizeMessagePart = (part: unknown): UIMessage['parts'][number] | null => {
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
      .map(normalizeMessagePart)
      .filter((part): part is UIMessage['parts'][number] => part !== null);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [{ type: 'text', text: value.trim() }];
  }

  return [];
};

const sanitizeMessagesForRequest = (messages: UIMessage[]): UIMessage[] => {
  const idPrefix = Date.now().toString(36);

  return messages
    .map((message, index): UIMessage | null => {
      const role = message.role;
      if (role !== 'system' && role !== 'user' && role !== 'assistant') {
        return null;
      }

      const fromParts = normalizePartsFromValue(message.parts);
      const fromContent = fromParts.length > 0
        ? []
        : normalizePartsFromValue((message as unknown as Record<string, unknown>).content);
      const fromText = fromParts.length > 0 || fromContent.length > 0
        ? []
        : normalizePartsFromValue((message as unknown as Record<string, unknown>).text);
      const normalizedParts = fromParts.length > 0 ? fromParts : fromContent.length > 0 ? fromContent : fromText;

      if (normalizedParts.length === 0) {
        return null;
      }

      return {
        ...message,
        id: typeof message.id === 'string' && message.id.length > 0 ? message.id : `${idPrefix}-${index}`,
        parts: normalizedParts,
      };
    })
    .filter((message): message is UIMessage => message !== null);
};

export function useAIChat(options: UseAIChatOptions = {}) {
  const { defaultModel = DEFAULT_CHAT_MODEL_KEY, defaultMode = 'academic' } = options;
  const { showToast } = useToast();
  const [selectedModel, setSelectedModel] = useState<ChatModelKey>(defaultModel);
  const [selectedMode, setSelectedMode] = useState<ChatMode>(defaultMode);
  const [allowPaidFallback, setAllowPaidFallback] = useState<boolean>(
    getStoredPaidFallbackPreference,
  );
  const [input, setInput] = useState('');
  const [modelFallbackNotice, setModelFallbackNotice] = useState<string | null>(null);
  const [continuationHint, setContinuationHint] = useState<string | null>(null);
  const latestModelRef = useRef<ChatModelKey>(defaultModel);
  const latestModeRef = useRef<ChatMode>(defaultMode);
  const latestAllowPaidFallbackRef = useRef<boolean>(allowPaidFallback);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const lastErrorMessageRef = useRef<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    latestModelRef.current = selectedModel;
  }, [selectedModel]);

  useEffect(() => {
    latestModeRef.current = selectedMode;
  }, [selectedMode]);

  useEffect(() => {
    latestAllowPaidFallbackRef.current = allowPaidFallback;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        PAID_FALLBACK_STORAGE_KEY,
        allowPaidFallback ? 'true' : 'false',
      );
    }
  }, [allowPaidFallback]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        fetch: async (inputValue, init) => {
          const response = await fetch(inputValue, init);
          const fallbackApplied = response.headers.get('X-Chat-Model-Fallback') === 'true';
          const resolvedModel = response.headers.get('X-Chat-Model-Resolved');
          const requestedModel = response.headers.get('X-Chat-Model-Requested');

          if (fallbackApplied && resolvedModel) {
            const message = requestedModel
              ? `Selected model "${requestedModel}" is unavailable. Using "${resolvedModel}" instead.`
              : `Selected model is unavailable. Using "${resolvedModel}" instead.`;
            setModelFallbackNotice(message);
          } else {
            setModelFallbackNotice(null);
          }

          return response;
        },
        prepareSendMessagesRequest: async ({ body, headers, id, messages, trigger, messageId }) => {
          const currentUser = auth.currentUser;
          const requestHeaders = new Headers(headers);

          if (currentUser) {
            const idToken = await currentUser.getIdToken();
            requestHeaders.set('Authorization', `Bearer ${idToken}`);
          }

          const sanitizedMessages = sanitizeMessagesForRequest(messages);

          return {
            headers: requestHeaders,
            body: {
              ...(body ?? {}),
              id,
              messages: sanitizedMessages.length > 0 ? sanitizedMessages : messages,
              trigger,
              messageId,
              model: latestModelRef.current,
              mode: latestModeRef.current,
              allowPaidFallback: latestAllowPaidFallbackRef.current,
            },
          };
        },
      }),
    [],
  );

  const { messages, status, sendMessage, stop, error, clearError, setMessages } = useChat({
    transport,
    messageMetadataSchema: chatMessageMetadataSchema,
    onFinish: ({ finishReason, isAbort, isDisconnect, isError }) => {
      setContinuationHint(getContinuationHint({ finishReason, isAbort, isDisconnect, isError }));
    },
  });

  const isGenerating = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, status]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  useEffect(() => {
    if (!error) {
      lastErrorMessageRef.current = null;
      return;
    }

    if (error.message !== lastErrorMessageRef.current) {
      showToast(
        getFriendlyChatErrorMessage(error.message || 'Failed to send message'),
        'error',
      );
      lastErrorMessageRef.current = error.message;
    }
  }, [error, showToast]);

  const handleSubmit = useCallback(async () => {
    const rawInput = input;
    const trimmedPrompt = rawInput.trim();
    if (trimmedPrompt.length === 0 || isGenerating) {
      return;
    }

    setInput('');
    clearError();
    setContinuationHint(null);

    try {
      await sendMessage({ text: trimmedPrompt });
    } catch (sendError) {
      console.error('Failed to submit chat message:', sendError);
      setInput((currentInput) => (currentInput.length === 0 ? rawInput : currentInput));
    }
  }, [clearError, input, isGenerating, sendMessage]);

  const handleClearChat = useCallback(() => {
    stop();
    setMessages([]);
    clearError();
    setModelFallbackNotice(null);
    setContinuationHint(null);
  }, [clearError, setMessages, stop]);

  const scrollToBottom = useCallback(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const handleContinue = useCallback(async () => {
    if (isGenerating) {
      return;
    }

    clearError();
    setContinuationHint(null);

    try {
      await sendMessage({ text: CONTINUE_RESPONSE_PROMPT });
    } catch (sendError) {
      console.error('Failed to continue chat response:', sendError);
    }
  }, [clearError, isGenerating, sendMessage]);

  return {
    messages,
    input,
    setInput,
    status,
    isGenerating,
    error,
    clearError,
    continuationHint,
    modelFallbackNotice,
    selectedModel,
    setSelectedModel,
    selectedMode,
    setSelectedMode,
    allowPaidFallback,
    setAllowPaidFallback,
    messagesContainerRef,
    endOfMessagesRef,
    showScrollButton,
    scrollToBottom,
    handleSubmit,
    handleContinue,
    handleClearChat,
    stop,
  };
}
