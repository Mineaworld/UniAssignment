const subjectTimestampFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const isValidDate = (value?: string): value is string => {
  if (!value) return false;
  return !Number.isNaN(new Date(value).getTime());
};

export const getSubjectInitials = (name: string): string => {
  const normalized = name.trim();
  if (!normalized) return '?';

  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return (parts[0] ?? '').slice(0, 2).toUpperCase();
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
};

export const formatSubjectLastUpdated = (
  lastUpdated?: string,
  createdAt?: string
): string => {
  const resolvedTimestamp =
    isValidDate(lastUpdated) ? lastUpdated :
    isValidDate(createdAt) ? createdAt :
    undefined;

  if (!resolvedTimestamp) {
    return 'Recently updated';
  }

  return subjectTimestampFormatter.format(new Date(resolvedTimestamp));
};
