import React, { useRef, useEffect } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onStop: () => Promise<void> | void;
  isLoading: boolean;
  disabled?: boolean;
  onFocusChange?: (focused: boolean) => void;
}

const ChatInput = ({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading,
  disabled = false,
  onFocusChange,
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSubmitDisabled = value.trim().length === 0 || disabled || isLoading;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [value]);

  return (
    <div className="border-t border-border/40 bg-background/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:gap-3 max-[360px]:grid-cols-1">
        {/* Input container with subtle glow on focus */}
        <div className="relative min-w-0 group">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 opacity-0 blur transition-opacity group-focus-within:opacity-100" />
          <div className="relative flex items-end rounded-2xl border border-border/60 bg-background/90 dark:bg-white/5 transition-colors focus-within:border-primary/50">
            <textarea
              ref={textareaRef}
              value={value}
              disabled={disabled}
              rows={1}
              placeholder="Ask anything about your classes, assignments, or study plan..."
              className={cn(
                "max-h-40 min-h-[48px] flex-1 resize-none bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60",
                disabled && "cursor-not-allowed opacity-60"
              )}
              onChange={(event) => onChange(event.target.value)}
              onFocus={() => onFocusChange?.(true)}
              onBlur={() => onFocusChange?.(false)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (isLoading) {
                    onStop();
                    return;
                  }
                  if (!isSubmitDisabled) {
                    void onSubmit();
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Action button */}
        {isLoading ? (
          <button
            type="button"
            aria-label="Stop generating"
            onClick={() => void onStop()}
            className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl border border-border/60 bg-muted/50 text-muted-foreground transition-all hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive active:scale-95 sm:h-12 sm:w-12 max-[360px]:h-10 max-[360px]:w-full"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Send message"
            disabled={isSubmitDisabled}
            onClick={() => void onSubmit()}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl transition-all active:scale-95 sm:h-12 sm:w-12 max-[360px]:h-10 max-[360px]:w-full",
              isSubmitDisabled
                ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                : "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Helper text */}
      <div className="mt-2 flex items-center justify-between px-1">
        <p className="hidden md:block text-[11px] text-muted-foreground/70">
          <kbd className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium">Enter</kbd> to send | <kbd className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium">Shift + Enter</kbd> for new line
        </p>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-[11px] text-primary">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>Generating...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
