/**
 * Consolidated date formatting utilities
 * Centralizes all date formatting logic used across the application
 */

// ISO formatting (for storage/comparison)
export const formatToISO = (date: Date): string =>
  date.toISOString().split('T')[0];

// Display formats
export const formatShortDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const formatDateWithWeekday = (dateString: string): string =>
  new Date(dateString).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export const formatLongDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export const formatTime = (dateString: string): string =>
  new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

// Form utilities
export const extractDatePart = (isoString: string): string =>
  new Date(isoString).toISOString().split('T')[0];

export const extractTimePart = (isoString: string): string =>
  new Date(isoString).toTimeString().slice(0, 5);

// Locale-aware (for Settings)
export const formatLocaleDateShort = (dateString: string | null): string | null => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
