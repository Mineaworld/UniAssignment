import React, { useState, useCallback } from "react";
import { isTextUIPart, type UIMessage } from "ai";
import { User, Bot, Check, Copy, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../../utils/cn";
import { getChatModelLabelById } from "../../constants/chatModels";
import type { ChatMessageMetadata } from "../../utils/chatMessageMetadata";

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

interface CodeBlockProps {
  language?: string;
  children: string;
}

const CodeBlock = ({ language, children }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [children]);

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-xl border border-border/60 bg-zinc-50 dark:bg-zinc-900/80">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/40 bg-zinc-100/80 dark:bg-zinc-800/60 px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all",
            copied
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "text-muted-foreground hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 hover:text-foreground",
          )}
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="!m-0 !bg-transparent p-4 text-sm leading-relaxed">
          <code
            className={cn(
              "block font-mono text-zinc-800 dark:text-zinc-200",
              language && `language-${language}`,
            )}
          >
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
};

// Inline code styling
const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[0.85em] font-mono text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60">
    {children}
  </code>
);

const ChatMessage = ({
  message,
  isStreaming = false,
}: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  if (message.role !== "user" && message.role !== "assistant") {
    return null;
  }

  const isUser = message.role === "user";
  const metadata = (message.metadata ?? undefined) as
    | ChatMessageMetadata
    | undefined;
  const paidFallbackModelId = metadata?.responseModelId;
  const paidFallbackLabel = paidFallbackModelId
    ? getChatModelLabelById(paidFallbackModelId)
    : "Paid fallback model";
  const text = message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("\n")
    .trim();

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  return (
    <div
      className={cn(
        "group/message flex w-full gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/80 text-muted-foreground border border-border/50",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message bubble with copy button */}
      <div
        className={cn(
          "flex flex-col gap-1",
          isUser ? "items-end" : "items-start",
          "max-w-[80%]",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-md"
              : "bg-muted/40 text-foreground rounded-tl-md border border-border/40 dark:bg-white/5",
          )}
        >
          {text.length > 0 ? (
            isUser ? (
              <div className="whitespace-pre-wrap break-words">{text}</div>
            ) : (
              <div
                className={cn(
                  "prose prose-sm dark:prose-invert max-w-none",
                  "prose-p:my-2 prose-p:leading-relaxed",
                  "prose-headings:mt-4 prose-headings:mb-2",
                  "prose-ul:my-2 prose-ol:my-2",
                  "prose-li:my-0.5",
                  "prose-table:overflow-x-auto",
                  "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
                  "prose-pre:m-0 prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-0",
                  "prose-code:before:content-none prose-code:after:content-none",
                  isStreaming && "animate-fade-in-fast",
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noreferrer noopener">
                        {children}
                      </a>
                    ),
                    pre: ({ children }) => {
                      // Extract code element and its props
                      const codeElement = React.Children.toArray(children).find(
                        (
                          child,
                        ): child is React.ReactElement<{
                          className?: string;
                          children?: React.ReactNode;
                        }> =>
                          React.isValidElement(child) && child.type === "code",
                      );

                      if (codeElement) {
                        const className = codeElement.props.className || "";
                        const match = /language-(\w+)/.exec(className);
                        const language = match ? match[1] : undefined;
                        const codeContent = String(
                          codeElement.props.children || "",
                        ).replace(/\n$/, "");

                        return (
                          <CodeBlock language={language}>
                            {codeContent}
                          </CodeBlock>
                        );
                      }

                      return (
                        <pre className="overflow-x-auto max-w-full">
                          {children}
                        </pre>
                      );
                    },
                    code: ({ className, children, ...props }) => {
                      // Check if this is inline code
                      const isInline = !className?.includes("language-");
                      if (isInline) {
                        return <InlineCode>{children}</InlineCode>;
                      }

                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3 rounded-lg border border-border/60">
                        <table className="!m-0">{children}</table>
                      </div>
                    ),
                  }}
                >
                  {text}
                </ReactMarkdown>
              </div>
            )
          ) : isStreaming ? (
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              No response received.
            </span>
          )}
        </div>

        {!isUser && metadata?.paidFallbackApplied && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-700 dark:text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Paid fallback: {paidFallbackLabel}</span>
          </div>
        )}

        {/* Copy message button on hover at bottom */}
        {text.length > 0 && (
          <button
            onClick={handleCopyMessage}
            className={cn(
              "flex items-center justify-center rounded-md p-1.5 transition-all",
              "opacity-0 group-hover/message:opacity-100",
              copied
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
            aria-label={copied ? "Copied!" : "Copy message"}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
