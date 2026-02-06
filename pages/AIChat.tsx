import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquareText, RotateCcw, ChevronDown, Bot } from "lucide-react";
import { auth } from "../firebase";
import { AnimatedThemeToggler } from "../components/ui/AnimatedThemeToggler";
import ChatMessage from "../components/chat/ChatMessage";
import ChatSettingsBar from "../components/chat/ChatSettingsBar";
import ChatInput from "../components/chat/ChatInput";
import { getFriendlyChatErrorMessage } from "../utils/chatError";
import { useAIChat } from "../hooks/useAIChat";

const AIChat = () => {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isBlurTransitioning, setIsBlurTransitioning] = useState(false);
  const blurTransitionTimerRef = useRef<number | null>(null);
  const {
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
  } = useAIChat();

  useEffect(() => {
    if (!isInputFocused) {
      return;
    }
    const frame = window.requestAnimationFrame(scrollToBottom);
    const timer = window.setTimeout(scrollToBottom, 120);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isInputFocused, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (blurTransitionTimerRef.current !== null) {
        window.clearTimeout(blurTransitionTimerRef.current);
      }
    };
  }, []);

  const handleInputFocusChange = useCallback((focused: boolean) => {
    if (blurTransitionTimerRef.current !== null) {
      window.clearTimeout(blurTransitionTimerRef.current);
      blurTransitionTimerRef.current = null;
    }

    if (focused) {
      setIsBlurTransitioning(false);
      setIsInputFocused(true);
      return;
    }

    setIsInputFocused(false);
    setIsBlurTransitioning(true);
    blurTransitionTimerRef.current = window.setTimeout(() => {
      setIsBlurTransitioning(false);
      blurTransitionTimerRef.current = null;
    }, 180);
  }, []);

  const isComposerCompact = isInputFocused || isBlurTransitioning;

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col overflow-hidden px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 md:max-w-5xl md:p-6 xl:max-w-6xl">
      {/* Header - Simplified */}
      <div className="flex items-center justify-between gap-4 py-3">
        <h1 className="text-2xl font-bold">AI Chat</h1>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              aria-label="Clear chat"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              title="Clear chat"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <AnimatedThemeToggler className="md:hidden h-10 w-10 bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Chat Container - Takes all remaining space */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/80 dark:bg-white/[0.02] backdrop-blur-sm">
        {modelFallbackNotice && (
          <div className="mx-4 mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            {modelFallbackNotice}
          </div>
        )}

        {/* Messages Area - flex-1 to fill available height */}
        <div
          ref={messagesContainerRef}
          className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4 md:p-5 custom-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-4 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <MessageSquareText className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Start a conversation
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Ask for explanations, summaries, study plans, or help with your
                assignments.
              </p>

              {/* Quick prompts */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "Quiz me quickly",
                  "Explain it like I'm 12",
                  "Build a 30-min plan",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={
                    status === "streaming" &&
                    index === messages.length - 1 &&
                    message.role === "assistant"
                  }
                />
              ))}
              {/* Show loading placeholder when waiting for AI response */}
              {status === "submitted" && !error && (
                <div className="flex w-full gap-3 flex-row">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/80 text-muted-foreground border border-border/50">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-tl-md px-4 py-3 text-sm bg-muted/40 border border-border/40 dark:bg-white/5">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            className="absolute bottom-36 left-1/2 z-50 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/95 px-3 py-1.5 text-xs text-muted-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-muted/50 hover:text-foreground"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Scroll to bottom
          </button>
        )}

        {/* Error display */}
        {error && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
            <span className="flex-1">
              {getFriendlyChatErrorMessage(error.message)}
            </span>
            <button
              onClick={clearError}
              className="rounded px-2 py-0.5 hover:bg-red-500/20"
            >
              Dismiss
            </button>
          </div>
        )}

        {continuationHint && !error && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
            <span className="flex-1">{continuationHint}</span>
            <button
              onClick={() => void handleContinue()}
              className="rounded bg-blue-500/15 px-2 py-0.5 text-blue-800 transition hover:bg-blue-500/25 dark:text-blue-200"
            >
              Continue
            </button>
          </div>
        )}

        {/* Settings Bar - Compact, above input */}
        <div
          className={`overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-out md:max-h-48 md:opacity-100 md:translate-y-0 ${
            isComposerCompact
              ? "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
              : "max-h-48 opacity-100 translate-y-0"
          }`}
        >
          <ChatSettingsBar
            model={selectedModel}
            onModelChange={setSelectedModel}
            mode={selectedMode}
            onModeChange={setSelectedMode}
            allowPaidFallback={allowPaidFallback}
            onAllowPaidFallbackChange={setAllowPaidFallback}
            disabled={isGenerating}
          />
        </div>

        {/* Input Area */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onStop={stop}
          isLoading={isGenerating}
          disabled={!auth.currentUser}
          onFocusChange={handleInputFocusChange}
        />
      </div>
    </div>
  );
};

export default AIChat;
