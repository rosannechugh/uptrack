import type { ResponseTimePoint, CheckResult } from '@/types/api'
import { parseTimestamp } from './format'

/** Fixed categorical order from the validated palette (adjacent-pair safe). */
export const SERIES_COLORS = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#6250d6',
  '#e34948',
] as const
export const OTHER_COLOR = '#8a93a3'
export const MAX_SERIES = SERIES_COLORS.length

export interface ChartSeries {
  key: string
  websiteId: number | null
  name: string
  color: string
}

export interface ChartRow {
  ts: number
  [seriesKey: string]: number | boolean | null | undefined
}

export interface ResponseChartModel {
  rows: ChartRow[]
  series: ChartSeries[]
  /** Points of failed checks, for red markers: one entry per failed sample. */
  failures: { ts: number; seriesKey: string; value: number }[]
  /** How many websites were folded into the "Other websites" series. */
  foldedCount: number
}

/**
 * Converts the API's newest-first list into chronological per-website series.
 * Colour follows the website (by id order), never its rank in the data.
 * Websites beyond the palette fold into one grey series.
 */
export function buildResponseChart(points: ResponseTimePoint[]): ResponseChartModel {
  const chronological = [...points].sort(
    (a, b) => parseTimestamp(a.checked_at).getTime() - parseTimestamp(b.checked_at).getTime(),
  )

  const sites = new Map<number, string>()
  for (const p of chronological) sites.set(p.website_id, p.website_name)
  const ids = [...sites.keys()].sort((a, b) => a - b)

  const palette = ids.slice(0, MAX_SERIES)
  const folded = ids.slice(MAX_SERIES)
  const foldedSet = new Set(folded)

  const series: ChartSeries[] = palette.map((id, i) => ({
    key: `w${id}`,
    websiteId: id,
    name: sites.get(id) ?? `Website ${id}`,
    color: SERIES_COLORS[i] ?? OTHER_COLOR,
  }))
  if (folded.length) {
    series.push({ key: 'other', websiteId: null, name: 'Other websites', color: OTHER_COLOR })
  }

  const rows: ChartRow[] = []
  const failures: ResponseChartModel['failures'] = []
  for (const p of chronological) {
    if (p.response_time_ms === null) continue
    const key = foldedSet.has(p.website_id) ? 'other' : `w${p.website_id}`
    const ts = parseTimestamp(p.checked_at).getTime()
    rows.push({ ts, [key]: p.response_time_ms, [`${key}:up`]: p.is_up, [`${key}:code`]: p.status_code ?? null })
    if (!p.is_up) failures.push({ ts, seriesKey: key, value: p.response_time_ms })
  }

  return { rows, series, failures, foldedCount: folded.length }
}

export interface DetailPoint {
  ts: number
  ms: number
  isUp: boolean
  statusCode: number | null
}

/** One website's check history, oldest first, skipping checks with no timing. */
export function buildDetailSeries(checks: CheckResult[]): DetailPoint[] {
  return [...checks]
    .sort((a, b) => parseTimestamp(a.checked_at).getTime() - parseTimestamp(b.checked_at).getTime())
    .filter((c) => c.response_time_ms !== null)
    .map((c) => ({
      ts: parseTimestamp(c.checked_at).getTime(),
      ms: c.response_time_ms as number,
      isUp: c.is_up,
      statusCode: c.status_code,
    }))
}
