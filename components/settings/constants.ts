export const TIMEZONES = [
  { value: 'Asia/Phnom_Penh', label: 'Cambodia (GMT+7)' },
  { value: 'Asia/Bangkok', label: 'Thailand (GMT+7)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Vietnam (GMT+7)' },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Japan (GMT+9)' },
  { value: 'Asia/Seoul', label: 'Korea (GMT+9)' },
  { value: 'America/New_York', label: 'US Eastern (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (GMT-8)' },
  { value: 'Europe/London', label: 'UK (GMT+0)' },
  { value: 'Europe/Paris', label: 'Central Europe (GMT+1)' },
] as const;

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const value = `${hour.toString().padStart(2, '0')}:${minute}`;
  const label = new Date(`2000-01-01T${value}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return { value, label };
});

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

export const DEFAULT_TIMEZONE = 'Asia/Phnom_Penh';
