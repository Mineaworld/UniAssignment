import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReminderPreset, AssignmentReminder } from '../types';
import { calculateReminderTime, formatReminderText, getPresetShort } from '../utils/reminder';

interface ReminderSelectorProps {
  dueDate: string;
  value?: AssignmentReminder;
  onChange: (reminder: AssignmentReminder | undefined) => void;
  disabled?: boolean;
}

// Unit to minutes conversion for relative time input
const UNIT_TO_MINUTES: Record<string, number> = {
  minutes: 1,
  hours: 60,
  days: 1440,
};

const PRESET_OPTIONS: ReminderPreset[] = [
  ReminderPreset.OneHour,
  ReminderPreset.SixHours,
  ReminderPreset.OneDay,
  ReminderPreset.ThreeDays,
  ReminderPreset.OneWeek,
];

export function ReminderSelector({ dueDate, value, onChange, disabled }: ReminderSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customMode, setCustomMode] = useState<'relative' | 'absolute'>('relative');
  const [customError, setCustomError] = useState<string>('');

  const isEnabled = value?.enabled ?? false;
  const currentPreset = value?.preset ?? ReminderPreset.OneDay;

  const handleToggle = () => {
    onChange(isEnabled ? undefined : { enabled: true, preset: ReminderPreset.OneDay });
  };

  const handlePresetSelect = (preset: ReminderPreset) => {
    if (preset === ReminderPreset.Custom) {
      onChange({ enabled: true, preset: ReminderPreset.Custom });
      setIsExpanded(true);
      setCustomMode('relative');
    } else {
      onChange({ enabled: true, preset });
    }
  };

  const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCustomError('');
    const formData = new FormData(e.currentTarget);

    if (customMode === 'relative') {
      const amountStr = formData.get('amount') as string;
      const amount = parseInt(amountStr, 10);
      const unit = formData.get('unit') as keyof typeof UNIT_TO_MINUTES;

      // Validate amount is a positive number
      if (!amountStr || isNaN(amount) || amount <= 0) {
        setCustomError('Please enter a valid number greater than 0');
        return;
      }

      const customMinutes = amount * UNIT_TO_MINUTES[unit];
      onChange({ enabled: true, preset: ReminderPreset.Custom, customMinutes });
    } else {
      const date = formData.get('date') as string;
      const time = formData.get('time') as string;
      if (date && time) {
        const customTime = new Date(`${date}T${time}`).toISOString();
        onChange({ enabled: true, preset: ReminderPreset.Custom, customTime });
      } else {
        setCustomError('Please select both date and time');
      }
    }
  };

  const reminderTime = isEnabled && value ? calculateReminderTime(dueDate, value) : null;
  const previewText = isEnabled && value ? formatReminderText(dueDate, value) : '';
  const isPastDue = reminderTime && reminderTime < new Date();

  return (
    <div className="space-y-3">
      {/* Toggle Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">
            notifications
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Reminder
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
          }`}
          aria-label={isEnabled ? 'Disable reminder' : 'Enable reminder'}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Expanded Options */}
      <AnimatePresence>
        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Preview */}
            {previewText && reminderTime && (
              <div
                className={`text-xs flex items-center gap-1 ${
                  isPastDue ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isPastDue ? 'warning' : 'schedule'}
                </span>
                <span>I'll remind you {previewText.toLowerCase()}</span>
                {isPastDue && ' (past due)'}
              </div>
            )}

            {/* Preset Grid */}
            <div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                Quick select
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {PRESET_OPTIONS.map((preset) => {
                  const isSelected = currentPreset === preset && currentPreset !== ReminderPreset.Custom;
                  const shortLabel = getPresetShort(preset);

                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-white ring-1 ring-primary'
                          : 'bg-gray-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/10'
                      }`}
                      aria-label={`Set reminder ${shortLabel} before due`}
                      aria-pressed={isSelected}
                    >
                      {shortLabel}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(!isExpanded);
                    if (!isExpanded) {
                      onChange({ enabled: true, preset: ReminderPreset.Custom });
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isExpanded && currentPreset === ReminderPreset.Custom
                      ? 'bg-primary text-white ring-1 ring-primary'
                      : 'bg-gray-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                  aria-label="Set custom reminder time"
                  aria-pressed={isExpanded && currentPreset === ReminderPreset.Custom}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Custom Options */}
            {isExpanded && currentPreset === ReminderPreset.Custom && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 space-y-3"
              >
                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setCustomMode('relative'); setCustomError(''); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      customMode === 'relative'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-white/20'
                    }`}
                    aria-pressed={customMode === 'relative'}
                  >
                    Before due
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCustomMode('absolute'); setCustomError(''); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      customMode === 'absolute'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-white/20'
                    }`}
                    aria-pressed={customMode === 'absolute'}
                  >
                    At specific time
                  </button>
                </div>

                {/* Error Message */}
                {customError && (
                  <p className="text-xs text-red-500 dark:text-red-400">{customError}</p>
                )}

                {/* Custom Form */}
                <form onSubmit={handleCustomSubmit} className="flex gap-2 items-end flex-wrap sm:flex-nowrap">
                  {customMode === 'relative' ? (
                    <>
                      <input
                        name="amount"
                        type="number"
                        min="1"
                        defaultValue={value?.customMinutes ? Math.round(value.customMinutes / 60) : 1}
                        placeholder="1"
                        onChange={() => setCustomError('')}
                        className="w-24 h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        aria-label="Amount of time before due"
                      />
                      <select
                        name="unit"
                        defaultValue={value?.customMinutes && value.customMinutes >= 1440 ? 'days' : 'hours'}
                        onChange={() => setCustomError('')}
                        className="flex-1 sm:flex-none h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        aria-label="Time unit"
                      >
                        <option value="hours">hours before</option>
                        <option value="days">days before</option>
                        <option value="minutes">minutes before</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <input
                        name="date"
                        type="date"
                        required
                        defaultValue={value?.customTime ? new Date(value.customTime).toISOString().split('T')[0] : ''}
                        className="flex-1 h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        aria-label="Reminder date"
                      />
                      <input
                        name="time"
                        type="time"
                        required
                        defaultValue={value?.customTime ? new Date(value.customTime).toTimeString().slice(0, 5) : ''}
                        className="w-28 h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        aria-label="Reminder time"
                      />
                    </>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 h-9 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Set
                  </button>
                </form>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
