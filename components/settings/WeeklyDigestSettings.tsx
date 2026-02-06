import React, { useState, useEffect } from 'react';
import { NeonButton } from '../ui/NeonButton';
import { Label } from '../ui/Label';
import { CalendarDays, Clock, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { WeeklyDigestSettings as WeeklyDigestSettingsType } from '../../types';
import { TIMEZONES, TIME_OPTIONS, DAYS_OF_WEEK, DEFAULT_TIMEZONE } from './constants';

interface Props {
  settings?: WeeklyDigestSettingsType;
  onSave: (settings: WeeklyDigestSettingsType) => Promise<void>;
  telegramLinked: boolean;
}

const WeeklyDigestSettings = ({ settings, onSave, telegramLinked }: Props) => {
  const [enabled, setEnabled] = useState(settings?.enabled ?? false);
  const [dayOfWeek, setDayOfWeek] = useState(settings?.dayOfWeek ?? 0);
  const [sendTime, setSendTime] = useState(settings?.sendTime ?? '18:00');
  const [timezone, setTimezone] = useState(settings?.timezone ?? DEFAULT_TIMEZONE);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setDayOfWeek(settings.dayOfWeek);
      setSendTime(settings.sendTime);
      setTimezone(settings.timezone);
    }
  }, [settings]);

  useEffect(() => {
    const changed =
      enabled !== (settings?.enabled ?? false) ||
      dayOfWeek !== (settings?.dayOfWeek ?? 0) ||
      sendTime !== (settings?.sendTime ?? '18:00') ||
      timezone !== (settings?.timezone ?? DEFAULT_TIMEZONE);
    setHasChanges(changed);
  }, [enabled, dayOfWeek, sendTime, timezone, settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        enabled,
        dayOfWeek,
        sendTime,
        timezone,
        lastSentWeek: settings?.lastSentWeek
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save weekly digest settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!telegramLinked) {
    return (
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-indigo-500" />
          <div>
            <p className="text-sm font-semibold text-foreground">Weekly Digest</p>
            <p className="text-sm text-muted-foreground">Connect Telegram to enable weekly summaries.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <CalendarDays className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Weekly Digest</p>
            <p className="text-sm text-muted-foreground">Get a summary of your upcoming week.</p>
          </div>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          role="switch"
          aria-checked={enabled}
          aria-label="Enable weekly digest"
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Day
              </Label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {DAYS_OF_WEEK.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
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

          <p className="text-xs text-muted-foreground">
            You'll receive a summary of assignments for the upcoming week, including completion stats from the previous week.
          </p>
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

export default WeeklyDigestSettings;
