export function formatDate(value?: string) {
  if (!value) return 'Waiting for first sync'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Recently synced'
    : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
