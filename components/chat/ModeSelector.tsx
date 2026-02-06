import React from 'react';
import { GraduationCap, MessageCircle } from 'lucide-react';
import { CHAT_MODES, type ChatMode } from '../../constants/chatModels';
import { cn } from '../../utils/cn';

interface ModeSelectorProps {
  value: ChatMode;
  onChange: (value: ChatMode) => void;
  disabled?: boolean;
}

const modeIcons: Record<ChatMode, React.ReactNode> = {
  academic: <GraduationCap className="h-3.5 w-3.5" />,
  general: <MessageCircle className="h-3.5 w-3.5" />,
};

const ModeSelector = ({ value, onChange, disabled = false }: ModeSelectorProps) => {
  return (
    <div
      className={cn(
        'flex rounded-lg border border-border/60 bg-background/80 p-0.5 dark:bg-white/5',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      {CHAT_MODES.map((mode) => {
        const isActive = value === mode.key;
        return (
          <button
            key={mode.key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mode.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {modeIcons[mode.key]}
            <span>{mode.key === 'academic' ? 'Academic' : 'General'}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ModeSelector;
