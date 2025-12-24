import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReminderPreset, AssignmentReminder } from '../types';
import { calculateReminderTime, formatReminderText, getPresetLabel, getPresetShort } from '../utils/reminder';

interface ReminderSelectorProps {
  dueDate: string;
  value?: AssignmentReminder;
  onChange: (reminder: AssignmentReminder | undefined) => void;
  disabled?: boolean;
}

const PRESET_OPTIONS: { preset: ReminderPreset; label: string; short: string }[] = [
  { preset: ReminderPreset.OneHour, label: '1 hour before', short: '1h' },
  { preset: ReminderPreset.SixHours, label: '6 hours before', short: '6h' },
  { preset: ReminderPreset.OneDay, label: '1 day before', short: '1d' },
  { preset: ReminderPreset.ThreeDays, label: '3 days before', short: '3d' },
  { preset: ReminderPreset.OneWeek, label: '1 week before', short: '1w' },
];

export const ReminderSelector: React.FC<ReminderSelectorProps> = ({ dueDate, value, onChange, disabled }) => {
  const [expanded, setExpanded] = useState(false);
  const [customMode, setCustomMode] = useState<'relative' | 'absolute'>('relative');

  const enabled = value?.enabled ?? false;
  const currentPreset = value?.preset ?? ReminderPreset.OneDay;

  const handleToggle = () => {
    if (enabled) {
      onChange(undefined);
    } else {
      onChange({ enabled: true, preset: ReminderPreset.OneDay });
    }
  };

  const handlePresetSelect = (preset: ReminderPreset) => {
    if (preset === ReminderPreset.Custom) {
      onChange({ enabled: true, preset: ReminderPreset.Custom });
      setExpanded(true);
      setCustomMode('relative');
    } else {
      onChange({ enabled: true, preset });
    }
  };

  const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (customMode === 'relative') {
      const amount = parseInt(formData.get('amount') || '0');
      const unit = formData.get('unit') as 'minutes' | 'hours' | 'days';
      const minutes = unit === 'days' ? amount * 1440 : unit === 'hours' ? amount * 60 : amount;
      onChange({ enabled: true, preset: ReminderPreset.Custom, customMinutes: minutes });
    } else {
      const date = formData.get('date') as string;
      const time = formData.get('time') as string;
      if (date && time) {
        onChange({ enabled: true, preset: ReminderPreset.Custom, customTime: new Date(`${date}T${time}`).toISOString() });
      }
    }
  };

  // Preview
  const previewText = enabled && value ? formatReminderText(dueDate, value) : '';
  const reminderTime = enabled && value ? calculateReminderTime(dueDate, value) : null;
  const isPastDue = reminderTime && reminderTime < new Date();

  return (
    <div className="space-y-3">
      {/* Toggle */}
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
          className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      {/* Expanded Options */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Preview */}
            {previewText && reminderTime && (
              <div className={`text-xs flex items-center gap-1 ${isPastDue ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
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
                {PRESET_OPTIONS.map((opt) => (
                  <button
                    key={opt.preset}
                    type="button"
                    onClick={() => handlePresetSelect(opt.preset)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      currentPreset === opt.preset && currentPreset !== ReminderPreset.Custom
                        ? 'bg-primary text-white ring-1 ring-primary'
                        : 'bg-gray-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {opt.short}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(!expanded);
                    if (!expanded) {
                      onChange({ enabled: true, preset: ReminderPreset.Custom });
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    expanded && currentPreset === ReminderPreset.Custom
                      ? 'bg-primary text-white ring-1 ring-primary'
                      : 'bg-gray-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Custom Options */}
            {expanded && currentPreset === ReminderPreset.Custom && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 space-y-3"
              >
                {/* Mode toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomMode('relative')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      customMode === 'relative'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-white/20'
                    }`}
                  >
                    Before due
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomMode('absolute')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      customMode === 'absolute'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-white/20'
                    }`}
                  >
                    At specific time
                  </button>
                </div>

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
                        className="w-24 h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <select
                        name="unit"
                        defaultValue={value?.customMinutes && value.customMinutes >= 1440 ? 'days' : 'hours'}
                        className="flex-1 sm:flex-none h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
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
                      />
                      <input
                        name="time"
                        type="time"
                        required
                        defaultValue={value?.customTime ? new Date(value.customTime).toTimeString().slice(0, 5) : ''}
                        className="w-28 h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
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
};
