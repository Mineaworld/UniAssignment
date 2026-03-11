import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { STATUS_CONFIG } from '../constants/statusConfig';
import { Status } from '../types';
import { cn } from '../utils/cn';

interface AssignmentStatusSelectProps {
  className?: string;
  disabled?: boolean;
  onChange: (nextStatus: Status) => Promise<void> | void;
  status: Status;
  testId: string;
}

const STATUS_OPTIONS = [Status.Pending, Status.InProgress, Status.Completed] as const;

export const AssignmentStatusSelect = ({
  className,
  disabled = false,
  onChange,
  status,
  testId,
}: AssignmentStatusSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedStatus, setHighlightedStatus] = useState(status);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Record<Status, HTMLButtonElement | null>>({
    [Status.Pending]: null,
    [Status.InProgress]: null,
    [Status.Completed]: null,
  });
  const statusStyle = STATUS_CONFIG[status];
  const StatusIcon = statusStyle.icon;
  const listboxId = `${testId}-listbox`;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setHighlightedStatus(status);
    optionRefs.current[status]?.focus();
  }, [isOpen, status]);

  const handleOptionClick = async (nextStatus: Status) => {
    setIsOpen(false);
    if (nextStatus !== status) {
      await onChange(nextStatus);
    }
  };

  const moveHighlight = (direction: 1 | -1) => {
    const currentIndex = STATUS_OPTIONS.indexOf(highlightedStatus);
    const nextIndex = (currentIndex + direction + STATUS_OPTIONS.length) % STATUS_OPTIONS.length;
    const nextStatus = STATUS_OPTIONS[nextIndex] ?? status;
    setHighlightedStatus(nextStatus);
    optionRefs.current[nextStatus]?.focus();
  };

  return (
    <div className={cn('relative inline-flex', className)} ref={containerRef}>
      <button
        type="button"
        data-testid={testId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className={cn(
          'inline-flex h-9 min-w-[138px] items-center justify-between gap-2 rounded-full border pl-4 pr-3.5 text-xs font-semibold leading-none shadow-sm transition-colors sm:h-10 sm:min-w-[152px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-70',
          statusStyle.bg,
          statusStyle.border,
          statusStyle.color
        )}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          event.stopPropagation();

          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen(true);
          }

          if (event.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="inline-flex items-center gap-2.5 pl-1">
          <StatusIcon className="h-3.5 w-3.5 shrink-0" />
          <span>{status}</span>
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 opacity-70 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Assignment status"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-[170px] rounded-2xl border border-border/70 bg-background/95 p-2 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-[#101622]/95"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              moveHighlight(1);
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              moveHighlight(-1);
            }

            if (event.key === 'Escape') {
              event.preventDefault();
              setIsOpen(false);
            }
          }}
        >
          {STATUS_OPTIONS.map((option) => {
            const optionStyle = STATUS_CONFIG[option];
            const OptionIcon = optionStyle.icon;
            const selected = option === status;

            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                data-testid={`${testId}-${option}`}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-xs font-semibold transition-colors',
                  highlightedStatus === option && !selected && 'bg-muted/60 dark:bg-white/10',
                  selected
                    ? cn(optionStyle.bg, optionStyle.border, optionStyle.color, 'border')
                    : 'text-foreground hover:bg-muted/60 dark:hover:bg-white/10'
                )}
                ref={(element) => {
                  optionRefs.current[option] = element;
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleOptionClick(option);
                }}
                onFocus={() => setHighlightedStatus(option)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    void handleOptionClick(option);
                  }
                }}
              >
                <span className="inline-flex items-center gap-2.5">
                  <OptionIcon className={cn('h-3.5 w-3.5 shrink-0', optionStyle.color)} />
                  <span>{option}</span>
                </span>
                {selected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
