import { api } from '@/services/api'
import { useResource } from '@/hooks/useResource'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/States'
import { formatMs } from '@/utils/format'
import { MetricCard, MetricCardSkeleton } from './MetricCard'

export function OverviewMetrics() {
  const { data, error, loading, reload } = useResource((signal) => api.getOverview({ signal }), [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-busy="true" aria-label="Loading overview">
        {Array.from({ length: 6 }, (_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    )
  }
  if (!data) {
    return (
      <Card>
        <ErrorState title="Could not load the overview" message={error ?? 'No data returned.'} onRetry={reload} compact />
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <MetricCard label="Active websites" value={data.total_websites} note="Websites being monitored" />
      <MetricCard label="Up" value={data.websites_up} tone="up" note="Latest check succeeded" />
      <MetricCard label="Down" value={data.websites_down} tone="down" note="Latest check failed" />
      <MetricCard label="Not checked" value={data.websites_unknown} tone="unknown" note="No check recorded yet" />
      <MetricCard
        label="Open incidents"
        value={data.open_incidents}
        tone={data.open_incidents > 0 ? 'down' : 'neutral'}
        note={data.open_incidents > 0 ? 'View incidents' : 'No ongoing incidents'}
        to="/incidents"
      />
      <MetricCard
        label="Avg response, 24h"
        value={formatMs(data.average_response_time_ms)}
        note={data.average_response_time_ms === null ? 'No timed checks in the last 24 hours' : 'Across all checks'}
      />
    </div>
  )
}
