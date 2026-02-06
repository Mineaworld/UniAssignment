import React, { useState, useEffect } from 'react';
import { NeonButton } from '../ui/NeonButton';
import { Label } from '../ui/Label';
import { Sun, Clock, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { DailyReminderSettings as DailyReminderSettingsType } from '../../types';
import { TIMEZONES, TIME_OPTIONS, DEFAULT_TIMEZONE } from './constants';

interface Props {
  settings?: DailyReminderSettingsType;
  onSave: (settings: DailyReminderSettingsType) => Promise<void>;
  telegramLinked: boolean;
}

const DailyReminderSettings = ({ settings, onSave, telegramLinked }: Props) => {
  const [enabled, setEnabled] = useState(settings?.enabled ?? false);
  const [sendTime, setSendTime] = useState(settings?.sendTime ?? '08:00');
  const [timezone, setTimezone] = useState(settings?.timezone ?? DEFAULT_TIMEZONE);
  const [skipWeekends, setSkipWeekends] = useState(settings?.skipWeekends ?? false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setSendTime(settings.sendTime);
      setTimezone(settings.timezone);
      setSkipWeekends(settings.skipWeekends);
    }
  }, [settings]);

  useEffect(() => {
    const changed =
      enabled !== (settings?.enabled ?? false) ||
      sendTime !== (settings?.sendTime ?? '08:00') ||
      timezone !== (settings?.timezone ?? DEFAULT_TIMEZONE) ||
      skipWeekends !== (settings?.skipWeekends ?? false);
    setHasChanges(changed);
  }, [enabled, sendTime, timezone, skipWeekends, settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        enabled,
        sendTime,
        timezone,
        skipWeekends,
        lastSentDate: settings?.lastSentDate
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save daily reminder settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!telegramLinked) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Sun className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-foreground">Daily Morning Reminder</p>
            <p className="text-sm text-muted-foreground">Connect Telegram to enable daily reminders.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Sun className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Daily Morning Reminder</p>
            <p className="text-sm text-muted-foreground">Get notified about today's assignments each morning.</p>
          </div>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          role="switch"
          aria-checked={enabled}
          aria-label="Enable daily morning reminder"
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              enabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 pl-11">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Send Time
              </Label>
              <select
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TIME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timezone
              </Label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSkipWeekends(!skipWeekends)}
              role="switch"
              aria-checked={skipWeekends}
              aria-label="Skip weekend reminders"
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                skipWeekends ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                  skipWeekends ? "translate-x-5" : "translate-x-1"
                )}
              />
            </button>
            <Label className="text-sm text-muted-foreground">Skip weekends</Label>
          </div>
        </div>
      )}

      {hasChanges && (
        <div className="flex justify-end pt-2">
          <NeonButton
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            glow
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </NeonButton>
        </div>
      )}
    </div>
  );
};

export default DailyReminderSettings;
