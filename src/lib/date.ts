export function todayISO(): string {
  return toISO(new Date())
}

/** Minutes since midnight right now, rounded up to the next 5 minutes. */
export function nowMinutes(): number {
  const d = new Date()
  const raw = d.getHours() * 60 + d.getMinutes()
  return Math.min(24 * 60 - 5, Math.ceil(raw / 5) * 5)
}

/** Default "start from" time for a given day: now (rounded) if it's today, otherwise no restriction. */
export function defaultStartTimeForDate(iso: string): number {
  return iso === todayISO() ? nowMinutes() : 0
}

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export function formatDateLabel(iso: string): string {
  const label = WEEKDAY_FORMATTER.format(new Date(`${iso}T12:00:00`))
  return label.charAt(0).toUpperCase() + label.slice(1)
}
