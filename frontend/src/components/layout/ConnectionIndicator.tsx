import { useHealth } from '@/context/healthContext'
import type { HealthState } from '@/context/healthContext'

const view: Record<HealthState, { label: string; dot: string; text: string }> = {
  checking: { label: 'Checking API', dot: 'bg-subtle', text: 'text-muted' },
  healthy: { label: 'API and database healthy', dot: 'bg-up', text: 'text-ink' },
  'database-down': { label: 'Database check failed', dot: 'bg-warn', text: 'text-warn' },
  unreachable: { label: 'API unreachable', dot: 'bg-down', text: 'text-down' },
}

const short: Record<HealthState, string> = {
  checking: 'Checking',
  healthy: 'Healthy',
  'database-down': 'Database error',
  unreachable: 'Unreachable',
}

/** Reflects the real result of GET /health, polled in the background. */
export function ConnectionIndicator() {
  const { state, detail, recheck } = useHealth()
  const v = view[state]
  return (
    <button
      type="button"
      onClick={recheck}
      title={detail ? `${v.label}. ${detail} Click to re-check.` : `${v.label}. Click to re-check.`}
      className="inline-flex h-8 items-center gap-2 rounded-full border border-line-strong bg-surface px-3 text-[13px] shadow-card hover:bg-sunken"
    >
      <span className="relative flex size-2">
        <span className={`absolute inline-flex size-full rounded-full ${v.dot}`} />
      </span>
      <span className={`font-medium ${v.text}`}>
        <span className="sr-only">{v.label}. </span>
        <span aria-hidden>
          <span className="hidden sm:inline">API: </span>
          {short[state]}
        </span>
      </span>
    </button>
  )
}
