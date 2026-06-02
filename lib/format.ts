export function formatDateRange(startsAt: string, endsAt: string): string {
  const start = new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric'
  }).format(new Date(startsAt));
  const end = new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric'
  }).format(new Date(endsAt));

  return `${start} - ${end}`;
}

export function formatRelativeDate(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}
