/** Parse a backend timestamp. Values without an offset are treated as UTC. */
export function parseTimestamp(value: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value)
  return new Date(hasZone ? value : `${value}Z`)
}

const dateTime = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})
const dateOnly = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
const timeOnly = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
const dateTimeFull = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
})

export const formatDateTime = (v: string) => dateTime.format(parseTimestamp(v))
export const formatDateTimeFull = (v: string) => dateTimeFull.format(parseTimestamp(v))
export const formatDate = (v: string) => dateOnly.format(parseTimestamp(v))
export const formatTime = (ms: number) => timeOnly.format(new Date(ms))

export function formatRelative(value: string, now = Date.now()): string {
  const diff = Math.round((now - parseTimestamp(value).getTime()) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '–'
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`
  return `${Math.round(ms)} ms`
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '–'
  return `${value.toFixed(value === 100 || value === 0 ? 0 : 2)}%`
}

export function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds % 3600 === 0) return `${seconds / 3600}h`
  if (seconds % 60 === 0) return `${seconds / 60}m`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

/** Elapsed time between two timestamps (end defaults to now). */
export function formatDuration(startIso: string, endIso: string | null, now = Date.now()): string {
  const start = parseTimestamp(startIso).getTime()
  const end = endIso ? parseTimestamp(endIso).getTime() : now
  const total = Math.max(0, Math.round((end - start) / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m ${s}s`
  return `${s}s`
}

export const formatCount = (n: number) => new Intl.NumberFormat().format(n)

export function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
