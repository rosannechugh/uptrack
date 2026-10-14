import { CheckCircle2, Globe } from 'lucide-react'
import { useMemo, useState } from 'react'
import { IncidentTable } from '@/components/incidents/IncidentTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Fields'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState, Notice } from '@/components/ui/States'
import { AddWebsiteButton } from '@/components/websites/AddWebsiteButton'
import { useAllIncidents, type IncidentRow } from '@/hooks/useAllIncidents'
import { parseTimestamp } from '@/utils/format'

type StatusFilter = 'all' | 'open' | 'resolved'
type SortKey = 'newest' | 'oldest' | 'longest'

const duration = (i: IncidentRow) =>
  (i.resolved_at ? parseTimestamp(i.resolved_at).getTime() : Date.now()) - parseTimestamp(i.started_at).getTime()

export function IncidentsPage() {
  const { data, error, loading, reload } = useAllIncidents()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [siteId, setSiteId] = useState<'all' | number>('all')
  const [sort, setSort] = useState<SortKey>('newest')

  const rows = useMemo(() => {
    const list = (data?.incidents ?? []).filter(
      (i) => (status === 'all' || i.status === status) && (siteId === 'all' || i.website_id === siteId),
    )
    const startedAt = (i: IncidentRow) => parseTimestamp(i.started_at).getTime()
    return list.sort((a, b) =>
      sort === 'oldest' ? startedAt(a) - startedAt(b) : sort === 'longest' ? duration(b) - duration(a) : startedAt(b) - startedAt(a),
    )
  }, [data, status, siteId, sort])

  const openCount = data?.incidents.filter((i) => i.status === 'open').length ?? 0
  const resolvedCount = data?.incidents.filter((i) => i.status === 'resolved').length ?? 0

  return (
    <>
      <PageHeader
        title="Incidents"
        description="An incident opens after two consecutive failed checks and resolves automatically after the next successful check. Incidents cannot be edited or closed manually."
      />

      {loading ? (
        <Card>
          <div className="space-y-4 p-5" aria-busy="true" aria-label="Loading incidents">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      ) : !data ? (
        <Card>
          <ErrorState title="Could not load incidents" message={error ?? 'No data returned.'} onRetry={reload} />
        </Card>
      ) : (
        <div className="space-y-3">
          {error && (
            <Notice title="Showing the last data we received" action={<Button size="sm" onClick={reload}>Retry</Button>}>
              The latest refresh failed: {error}
            </Notice>
          )}
          {data.failures.length > 0 && (
            <Notice
              title={`Incidents could not be loaded for ${data.failures.length} of ${data.websites.length} websites`}
              action={<Button size="sm" onClick={reload}>Retry</Button>}
            >
              The list below may be incomplete. Affected: {data.failures.map((f) => `${f.website.name} (${f.message})`).join('; ')}
            </Notice>
          )}

          <Card>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3">
              <p className="mr-auto text-[13px] text-muted">
                <span className="font-semibold text-down">{openCount} open</span>
                <span className="mx-1.5 text-subtle" aria-hidden>
                  /
                </span>
                <span className="font-semibold text-up">{resolvedCount} resolved</span>
              </p>
              <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </Select>
              <Select
                label="Website"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="max-w-[180px]"
              >
                <option value="all">All websites</option>
                {data.websites.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
              <Select label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="longest">Longest duration</option>
              </Select>
            </div>

            {data.websites.length === 0 ? (
              <EmptyState icon={Globe} title="No websites to monitor yet" action={<AddWebsiteButton />}>
                Incidents appear here once a monitored website fails two checks in a row.
              </EmptyState>
            ) : data.incidents.length === 0 ? (
              <EmptyState icon={CheckCircle2} title={data.failures.length ? 'No incidents loaded' : 'No incidents recorded'}>
                {data.failures.length
                  ? 'Some websites could not be queried, so this does not mean there were none.'
                  : 'None of your websites has failed two checks in a row.'}
              </EmptyState>
            ) : rows.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No incidents match these filters" compact>
                Change the status or website filter to see more.
              </EmptyState>
            ) : (
              <IncidentTable rows={rows} />
            )}
          </Card>
        </div>
      )}
    </>
  )
}
