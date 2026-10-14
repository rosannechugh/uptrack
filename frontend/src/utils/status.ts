import type { CheckResult, Website } from '@/types/api'

export type MonitorStatus = 'up' | 'down' | 'unknown'

/** Status comes only from the latest real check, never from the row existing. */
export function statusFromCheck(latest: CheckResult | null | undefined): MonitorStatus {
  if (!latest) return 'unknown'
  return latest.is_up ? 'up' : 'down'
}

export interface WebsiteSnapshot {
  website: Website
  /** Newest first, as returned by the API. null when the request failed. */
  checks: CheckResult[] | null
  checksError: string | null
  latest: CheckResult | null
  status: MonitorStatus
}

export function buildSnapshot(
  website: Website,
  checks: CheckResult[] | null,
  checksError: string | null,
): WebsiteSnapshot {
  const latest = checks && checks.length > 0 ? (checks[0] ?? null) : null
  return { website, checks, checksError, latest, status: statusFromCheck(latest) }
}

/** Explains the text for a check that has no HTTP status code. */
export function describeCheck(check: CheckResult): string {
  if (check.is_up) return check.status_code ? `HTTP ${check.status_code}` : 'Up'
  return check.error_message ?? (check.status_code ? `HTTP ${check.status_code}` : 'Check failed')
}
