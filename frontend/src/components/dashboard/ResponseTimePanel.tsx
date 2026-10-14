import { Activity } from 'lucide-react'
import { useState } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Fields'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { limits } from '@/config'
import { useResource } from '@/hooks/useResource'
import { api } from '@/services/api'
import { PERIODS, periodLabel } from './PeriodSelect'
import { ResponseTimeView } from './ResponseTimeView'

export function ResponseTimePanel() {
  const [hours, setHours] = useState(24)
  const limit = limits.responseTimesLimitMax
  const { data, error, loading, reload } = useResource(
    (signal) => api.getResponseTimes(hours, limit, { signal }),
    [hours],
  )

  const ok = data && data.period_hours === hours ? data : null
  const capped = ok !== null && ok.results.length >= limit

  return (
    <Card>
      <CardHeader
        title="Response times"
        description={`Every check across all websites in the last ${periodLabel(hours)}.`}
        actions={<Segmented label="Time range" value={hours} options={PERIODS} onChange={setHours} />}
      />
      <div className="p-5">
        {loading || (!ok && !error) ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !ok ? (
          <ErrorState title="Could not load response times" message={error ?? 'No data returned.'} onRetry={reload} compact />
        ) : ok.results.length === 0 ? (
          <EmptyState icon={Activity} title="No checks in this period" compact>
            Response times appear here after the first check runs. Try a longer range if checks are infrequent.
          </EmptyState>
        ) : (
          <>
            <ResponseTimeView points={ok.results} />
            {capped && (
              <p className="mt-2 text-xs text-muted">
                Showing the most recent {limit} checks in this range. Older checks are not included.
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              For failed checks, the time shown is how long the request ran before it failed.
            </p>
          </>
        )}
      </div>
    </Card>
  )
}
