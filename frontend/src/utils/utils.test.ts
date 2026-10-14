import { describe, expect, it } from 'vitest'
import type { CheckResult, ResponseTimePoint } from '@/types/api'
import { buildResponseChart, MAX_SERIES } from './chart'
import { mapWithConcurrency } from './concurrency'
import { formatDuration, formatInterval, formatMs, formatPercent, parseTimestamp } from './format'
import { statusFromCheck } from './status'
import { websiteSchema } from './validation'

const point = (id: number, at: string, ms: number | null, up = true): ResponseTimePoint => ({
  website_id: id,
  website_name: `Site ${id}`,
  checked_at: at,
  response_time_ms: ms,
  is_up: up,
  status_code: up ? 200 : 503,
})

describe('websiteSchema', () => {
  const ok = { name: 'Docs', url: 'https://example.com', check_interval_seconds: 60 }

  it('accepts a valid payload', () => {
    expect(websiteSchema.safeParse(ok).success).toBe(true)
  })
  it('rejects empty and over-long names', () => {
    expect(websiteSchema.safeParse({ ...ok, name: '  ' }).success).toBe(false)
    expect(websiteSchema.safeParse({ ...ok, name: 'x'.repeat(101) }).success).toBe(false)
    expect(websiteSchema.safeParse({ ...ok, name: 'x'.repeat(100) }).success).toBe(true)
  })
  it('requires http or https URLs', () => {
    for (const url of ['example.com', 'ftp://example.com', 'javascript:alert(1)', '']) {
      expect(websiteSchema.safeParse({ ...ok, url }).success).toBe(false)
    }
    expect(websiteSchema.safeParse({ ...ok, url: 'http://localhost:9000' }).success).toBe(true)
  })
  it('bounds the interval to 15..3600 whole seconds', () => {
    for (const n of [14, 3601, 20.5, NaN]) {
      expect(websiteSchema.safeParse({ ...ok, check_interval_seconds: n }).success).toBe(false)
    }
    for (const n of [15, 3600]) {
      expect(websiteSchema.safeParse({ ...ok, check_interval_seconds: n }).success).toBe(true)
    }
  })
})

describe('buildResponseChart', () => {
  it('orders newest-first API data chronologically', () => {
    const model = buildResponseChart([
      point(1, '2026-10-13T10:02:00+00:00', 300),
      point(1, '2026-10-13T10:01:00+00:00', 200),
      point(1, '2026-10-13T10:00:00+00:00', 100),
    ])
    expect(model.rows.map((r) => r.w1)).toEqual([100, 200, 300])
  })

  it('marks failed checks and keeps colour tied to the website id', () => {
    const model = buildResponseChart([
      point(7, '2026-10-13T10:01:00Z', 50, false),
      point(3, '2026-10-13T10:00:00Z', 80),
    ])
    expect(model.series.map((s) => s.websiteId)).toEqual([3, 7])
    expect(model.failures).toHaveLength(1)
    expect(model.failures[0]?.seriesKey).toBe('w7')
  })

  it('does not invent samples for null response times', () => {
    const model = buildResponseChart([point(1, '2026-10-13T10:00:00Z', null)])
    expect(model.rows).toHaveLength(0)
  })

  it('folds websites beyond the palette into one series', () => {
    const points = Array.from({ length: MAX_SERIES + 2 }, (_, i) => point(i + 1, `2026-10-13T10:0${i}:00Z`, 10 + i))
    const model = buildResponseChart(points)
    expect(model.series).toHaveLength(MAX_SERIES + 1)
    expect(model.foldedCount).toBe(2)
    expect(model.series.at(-1)?.key).toBe('other')
  })
})

describe('status and formatting', () => {
  const check = (is_up: boolean): CheckResult => ({
    id: 1, website_id: 1, is_up, status_code: is_up ? 200 : 503, response_time_ms: 10, error_message: null,
    checked_at: '2026-10-13T10:00:00Z',
  })
  it('never infers up without a check', () => {
    expect(statusFromCheck(null)).toBe('unknown')
    expect(statusFromCheck(check(true))).toBe('up')
    expect(statusFromCheck(check(false))).toBe('down')
  })
  it('treats timestamps without an offset as UTC', () => {
    expect(parseTimestamp('2026-10-13T10:00:00').toISOString()).toBe('2026-10-13T10:00:00.000Z')
    expect(parseTimestamp('2026-10-13T15:30:00+05:30').toISOString()).toBe('2026-10-13T10:00:00.000Z')
  })
  it('formats values', () => {
    expect(formatMs(null)).toBe('–')
    expect(formatMs(123.4)).toBe('123 ms')
    expect(formatMs(1500)).toBe('1.50 s')
    expect(formatPercent(100)).toBe('100%')
    expect(formatPercent(99.5)).toBe('99.50%')
    expect(formatInterval(90)).toBe('1m 30s')
    expect(formatInterval(3600)).toBe('1h')
    expect(formatDuration('2026-10-13T10:00:00Z', '2026-10-13T11:05:00Z')).toBe('1h 5m')
  })
})

describe('mapWithConcurrency', () => {
  it('limits parallelism and preserves order', async () => {
    let active = 0
    let peak = 0
    const out = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (n) => {
      active++
      peak = Math.max(peak, active)
      await new Promise((r) => setTimeout(r, 5))
      active--
      return n * 2
    })
    expect(out).toEqual([2, 4, 6, 8, 10, 12])
    expect(peak).toBeLessThanOrEqual(2)
  })
})
