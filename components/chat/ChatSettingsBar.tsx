import React from 'react';
import ModelSelector from './ModelSelector';
import ModeSelector from './ModeSelector';
import { type ChatMode, type ChatModelKey } from '../../constants/chatModels';

interface ChatSettingsBarProps {
  model: ChatModelKey;
  onModelChange: (model: ChatModelKey) => void;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  allowPaidFallback: boolean;
  onAllowPaidFallbackChange: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * Compact settings bar displayed above the chat input.
 * Contains model dropdown and mode pill toggles.
 */
const ChatSettingsBar = ({
  model,
  onModelChange,
  mode,
  onModeChange,
  allowPaidFallback,
  onAllowPaidFallbackChange,
  disabled = false,
}: ChatSettingsBarProps) => {
  return (
    <div className="border-t border-border/40 bg-background/60 px-4 py-2.5 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModelSelector value={model} onChange={onModelChange} disabled={disabled} />
        <ModeSelector value={mode} onChange={onModeChange} disabled={disabled} />
        <div className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2 dark:bg-white/5">
          <div className="pr-3">
            <p className="text-xs font-medium text-foreground">Paid fallback</p>
            <p className="text-[11px] text-muted-foreground">
              Use paid models if free ones are unavailable.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowPaidFallback}
            disabled={disabled}
            onClick={() => onAllowPaidFallbackChange(!allowPaidFallback)}
            className={`inline-flex h-6 w-11 items-center rounded-full border p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              allowPaidFallback
                ? 'border-emerald-600/80 bg-emerald-600'
                : 'border-border/70 bg-muted'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                allowPaidFallback ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSettingsBar;
