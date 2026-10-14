import { useState } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Fields'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { useResource } from '@/hooks/useResource'
import { api } from '@/services/api'
import { formatCount, formatPercent } from '@/utils/format'
import { PERIODS, periodLabel } from './PeriodSelect'

export function UptimePanel() {
  const [hours, setHours] = useState(24)
  const { data, error, loading, reload } = useResource((signal) => api.getUptime(hours, { signal }), [hours])

  const ok = data && data.period_hours === hours ? data : null
  const total = ok?.total_checks ?? 0
  const upShare = total ? (ok!.successful_checks / total) * 100 : 0

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Check success rate"
        description="Aggregate across every website’s checks. Not a per-website uptime figure."
        actions={<Segmented label="Reporting period" value={hours} options={PERIODS} onChange={setHours} />}
      />
      <div className="flex-1 p-5">
        {loading || (!ok && !error) ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !ok ? (
          <ErrorState title="Could not load uptime" message={error ?? 'No data returned.'} onRetry={reload} compact />
        ) : total === 0 ? (
          <p className="py-6 text-sm text-muted">
            No checks were recorded in the last {periodLabel(hours)}, so there is no success rate to show yet.
          </p>
        ) : (
          <>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">{formatPercent(ok.uptime_percentage)}</p>
            <p className="mt-1 text-[13px] text-muted">of checks succeeded in the last {periodLabel(hours)}</p>

            <div
              className="mt-5 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full"
              role="img"
              aria-label={`${ok.successful_checks} successful and ${ok.failed_checks} failed checks`}
            >
              {ok.successful_checks > 0 && <div className="rounded-full bg-up" style={{ width: `${upShare}%` }} />}
              {ok.failed_checks > 0 && <div className="flex-1 rounded-full bg-down" />}
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 text-[13px] text-muted">
                  <span className="size-2 rounded-full bg-up" aria-hidden />
                  Successful
                </dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{formatCount(ok.successful_checks)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[13px] text-muted">
                  <span className="size-2 rounded-full bg-down" aria-hidden />
                  Failed
                </dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{formatCount(ok.failed_checks)}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-muted">Total checks</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{formatCount(ok.total_checks)}</dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </Card>
  )
}
