import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowLeft, MessageSquareText, Bot, ChevronDown, SquarePen } from "lucide-react";
import { auth } from "../../firebase";
import ChatMessage from "./ChatMessage";
import ChatSettingsBar from "./ChatSettingsBar";
import ChatInput from "./ChatInput";
import { getFriendlyChatErrorMessage } from "../../utils/chatError";
import { useAIChat } from "../../hooks/useAIChat";

interface MobileChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// Animation variants similar to Pomodoro widget
const overlayVariants: Variants = {
  hidden: {
    opacity: 0,
    y: "100%",
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200,
      duration: 0.3,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 22,
      stiffness: 180,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: "100%",
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200,
      duration: 0.25,
    },
  },
};

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const MobileChatOverlay = ({
  isOpen,
  onClose,
}: MobileChatOverlayProps) => {
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

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const frame = window.requestAnimationFrame(scrollToBottom);
    const timer = window.setTimeout(scrollToBottom, 150);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isOpen, scrollToBottom]);

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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          {/* Chat Overlay */}
          <motion.div
            key="chat-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-x-0 top-0 z-[70] flex h-[100dvh] flex-col bg-background pb-[env(safe-area-inset-bottom)] md:hidden safe-area-top"
          >
            {/* Header with back button */}
            <div className="flex items-center justify-between border-b border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3">
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-foreground transition-colors hover:bg-muted"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </motion.button>
                <h1 className="text-lg font-semibold">AI Chat</h1>
              </div>
              {messages.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClearChat}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="New chat"
                >
                  <SquarePen className="h-5 w-5" />
                </motion.button>
              )}
            </div>

            {/* Chat Container */}
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              {modelFallbackNotice && (
                <div className="mx-4 mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  {modelFallbackNotice}
                </div>
              )}

              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4 custom-scrollbar"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-4 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <MessageSquareText className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-base font-semibold text-foreground">
                      Start a conversation
                    </h2>
                    <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                      Ask for explanations, summaries, or help with assignments.
                    </p>

                    {/* Quick prompts */}
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
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
                  className="absolute bottom-44 left-1/2 z-50 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/95 px-3 py-1.5 text-xs text-muted-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-muted/50 hover:text-foreground"
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

              {/* Settings Bar */}
              <div
                className={`overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-out ${
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileChatOverlay;
