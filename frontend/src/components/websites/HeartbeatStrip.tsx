import type { CheckResult } from '@/types/api'
import { formatDateTime, formatMs } from '@/utils/format'

/**
 * The most recent checks as a row of ticks, oldest on the left. Empty slots on
 * the left mean "no check recorded yet" and are never filled with fake data.
 */
export function HeartbeatStrip({
  checks,
  slots = 30,
  height = 'h-6',
}: {
  /** Newest first, as returned by the API. */
  checks: CheckResult[]
  slots?: number
  height?: string
}) {
  const recent = checks.slice(0, slots).reverse()
  const empty = Math.max(0, slots - recent.length)
  const down = recent.filter((c) => !c.is_up).length
  const label =
    recent.length === 0
      ? 'No checks recorded yet'
      : `Last ${recent.length} checks: ${recent.length - down} up, ${down} down`

  return (
    <div role="img" aria-label={label} className={`flex items-stretch gap-[2px] ${height}`}>
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e${i}`} className="w-[3px] rounded-[1px] bg-line" />
      ))}
      {recent.map((c) => (
        <span
          key={c.id}
          title={`${formatDateTime(c.checked_at)}: ${c.is_up ? 'Up' : 'Down'}, ${formatMs(c.response_time_ms)}`}
          className={`w-[3px] rounded-[1px] ${c.is_up ? 'bg-up' : 'bg-down'}`}
        />
      ))}
    </div>
  )
}
