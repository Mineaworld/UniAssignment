import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Cpu } from 'lucide-react';
import {
  CHAT_MODELS,
  CHAT_MODEL_BY_KEY,
  type ChatModelKey,
} from '../../constants/chatModels';
import { cn } from '../../utils/cn';

interface ModelSelectorProps {
  value: ChatModelKey;
  onChange: (value: ChatModelKey) => void;
  disabled?: boolean;
}

const ModelSelector = ({ value, onChange, disabled = false }: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);
  const currentModel = CHAT_MODEL_BY_KEY[value];

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 256;
    const viewportPadding = 16;
    const width = Math.min(menuWidth, window.innerWidth - viewportPadding * 2);
    const left = Math.min(rect.left, window.innerWidth - width - viewportPadding);
    const top = rect.top;
    setMenuStyle({
      top,
      left,
      width,
      transform: 'translateY(calc(-100% - 4px))',
    });
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleReposition = () => updateMenuPosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, updateMenuPosition]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (modelKey: ChatModelKey) => {
    onChange(modelKey);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Dropdown trigger button */}
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 dark:bg-white/5 px-3 py-1.5 text-sm font-medium transition-all',
          'hover:border-border hover:bg-muted/30',
          isOpen && 'border-primary/50 ring-2 ring-primary/10',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="max-w-[140px] truncate">{currentModel.label}</span>
        {currentModel.isFastRecommended && (
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
            Fast
          </span>
        )}
        <ChevronDown
          className={cn(
            'h-3 w-3 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown panel - rendered in portal to avoid clipping */}
      {isOpen && menuStyle
        && createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="listbox"
            style={menuStyle}
            className="fixed z-[80] max-w-[calc(100vw-2rem)] rounded-xl border border-border/60 bg-background shadow-lg dark:bg-zinc-900"
          >
            <div className="p-1">
              {CHAT_MODELS.map((model) => {
                const isActive = value === model.key;
                return (
                  <button
                    key={model.key}
                    type="button"
                    onClick={() => handleSelect(model.key)}
                    className={cn(
                      'flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'bg-primary/10 text-foreground'
                        : 'text-foreground hover:bg-muted/50'
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-medium">{model.label}</span>
                      {model.isFastRecommended && (
                        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                          Fast
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ModelSelector;
