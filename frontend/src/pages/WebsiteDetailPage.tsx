import { Activity, ArrowLeft, ExternalLink, Play, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ResponseTimeView } from '@/components/dashboard/ResponseTimeView'
import { IncidentTable } from '@/components/incidents/IncidentTable'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState, Notice } from '@/components/ui/States'
import { HttpCode, StatusBadge } from '@/components/ui/StatusBadge'
import { HeartbeatStrip } from '@/components/websites/HeartbeatStrip'
import { useResource } from '@/hooks/useResource'
import { useWebsiteActions } from '@/hooks/useWebsiteActions'
import { api } from '@/services/api'
import type { CheckResult, ResponseTimePoint, Website } from '@/types/api'
import { formatDate, formatDateTimeFull, formatInterval, formatMs, formatPercent, formatRelative } from '@/utils/format'
import { describeCheck, statusFromCheck } from '@/utils/status'
import { NotFoundState } from './NotFoundPage'

export function WebsiteDetailPage() {
  const { id } = useParams()
  const websiteId = Number(id)
  if (!id || !/^\d+$/.test(id) || websiteId < 1) {
    return <NotFoundState title="Website not found" message={`“${id ?? ''}” is not a valid website ID.`} />
  }
  return <WebsiteDetail key={websiteId} id={websiteId} />
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 px-5 py-4">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{children}</dd>
    </div>
  )
}

function WebsiteDetail({ id }: { id: number }) {
  const navigate = useNavigate()
  const site = useResource((signal) => api.getWebsite(id, { signal }), [id])
  const checks = useResource((signal) => api.getChecks(id, 100, { signal }), [id])
  const incidents = useResource((signal) => api.getIncidents(id, { signal }), [id])
  const { checking, deleting, checkNow, remove } = useWebsiteActions()

  const [manual, setManual] = useState<CheckResult | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const website: Website | null = site.data
  const history = checks.data
  const latest = history?.[0] ?? null

  const points = useMemo<ResponseTimePoint[]>(
    () =>
      (history ?? []).map((c) => ({
        website_id: c.website_id,
        website_name: website?.name ?? `Website ${id}`,
        checked_at: c.checked_at,
        response_time_ms: c.response_time_ms,
        is_up: c.is_up,
        status_code: c.status_code,
      })),
    [history, website?.name, id],
  )

  const stats = useMemo(() => {
    if (!history || history.length === 0) return null
    const up = history.filter((c) => c.is_up).length
    const times = history.map((c) => c.response_time_ms).filter((t): t is number => t !== null)
    return {
      count: history.length,
      successRate: (up / history.length) * 100,
      avg: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
    }
  }, [history])

  if (site.loading) {
    return (
      <div aria-busy="true" aria-label="Loading website">
        <Skeleton className="mb-3 h-8 w-64" />
        <Skeleton className="mb-6 h-4 w-80" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="mt-6 h-72 w-full" />
      </div>
    )
  }
  if (site.errorStatus === 404) {
    return (
      <NotFoundState
        title="Website not found"
        message="It may have been deleted. Go back to the list to pick another website."
      />
    )
  }
  if (!website) {
    return (
      <Card>
        <ErrorState title="Could not load this website" message={site.error ?? 'No data returned.'} onRetry={site.reload} />
      </Card>
    )
  }

  const busy = checking.has(website.id)
  const status = statusFromCheck(latest)

  const runCheck = async () => {
    const result = await checkNow(website)
    if (result) setManual(result)
  }

  const onDelete = async () => {
    if (await remove(website)) navigate('/websites', { replace: true })
  }

  const visibleChecks = showAll ? (history ?? []) : (history ?? []).slice(0, 20)

  return (
    <>
      <Link to="/websites" className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" aria-hidden />
        All websites
      </Link>

      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {website.name}
            {checks.loading ? <Skeleton className="h-6 w-20" /> : checks.error && !history ? <StatusBadge kind="error" label="Status unavailable" /> : <StatusBadge kind={status} />}
          </span>
        }
        description={
          <a
            href={website.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 break-all font-mono text-[13px] hover:text-accent"
          >
            {website.url}
            <ExternalLink className="size-3.5 shrink-0" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        }
        actions={
          <>
            <Button
              variant="primary"
              icon={<Play className="size-4" aria-hidden />}
              loading={busy}
              onClick={() => void runCheck()}
            >
              {busy ? 'Checking…' : 'Check now'}
            </Button>
            <Button icon={<Trash2 className="size-4" aria-hidden />} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        {manual && (
          <Notice
            tone={manual.is_up ? 'info' : 'warn'}
            title={manual.is_up ? 'Manual check: up' : 'Manual check: down'}
          >
            {formatDateTimeFull(manual.checked_at)}. {describeCheck(manual)}
            {manual.response_time_ms !== null && <>, {formatMs(manual.response_time_ms)}</>}.
          </Notice>
        )}

        {site.error && <Notice title="Showing the last data we received">The latest refresh failed: {site.error}</Notice>}

        <Card>
          <dl className="grid grid-cols-2 divide-line sm:grid-cols-3 lg:grid-cols-6 lg:divide-x [&>div]:border-b [&>div]:border-line lg:[&>div]:border-b-0">
            <Fact label="Last check">
              {latest ? (
                <span title={formatDateTimeFull(latest.checked_at)}>{formatRelative(latest.checked_at)}</span>
              ) : checks.loading ? (
                '…'
              ) : (
                <span className="text-muted">Never checked</span>
              )}
            </Fact>
            <Fact label="Latest response">{latest ? formatMs(latest.response_time_ms) : '–'}</Fact>
            <Fact label="HTTP status">
              <HttpCode code={latest?.status_code ?? null} />
            </Fact>
            <Fact label="Check interval">{formatInterval(website.check_interval_seconds)}</Fact>
            <Fact label={stats ? `Success, last ${stats.count} checks` : 'Success rate'}>
              {stats ? formatPercent(stats.successRate) : '–'}
            </Fact>
            <Fact label="Added">{formatDate(website.created_at)}</Fact>
          </dl>
        </Card>

        {!website.is_active && (
          <Notice tone="info" title="This website is marked inactive">
            The backend skips inactive websites in scheduled checks and in the overview totals.
          </Notice>
        )}

        <Card>
          <CardHeader
            title="Response time"
            description={stats ? `From the last ${stats.count} checks${stats.avg !== null ? `, averaging ${formatMs(stats.avg)}` : ''}.` : undefined}
          />
          <div className="p-5">
            {checks.loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : !history ? (
              <ErrorState title="Could not load check history" message={checks.error ?? 'No data returned.'} onRetry={checks.reload} compact />
            ) : history.length === 0 ? (
              <EmptyState icon={Activity} title="No checks yet" compact>
                The first scheduled check runs {formatInterval(website.check_interval_seconds)} after the website was
                added. Use “Check now” to run one immediately.
              </EmptyState>
            ) : (
              <>
                <div className="mb-4">
                  <HeartbeatStrip checks={history} slots={60} height="h-8" />
                  <p className="mt-1.5 text-xs text-muted">Last {Math.min(60, history.length)} checks, oldest on the left.</p>
                </div>
                <ResponseTimeView points={points} height={260} />
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Check history" description="Every recorded check, newest first." />
          {checks.loading ? (
            <div className="space-y-3 p-5" aria-busy="true">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : !history ? (
            <ErrorState message={checks.error ?? 'No data returned.'} onRetry={checks.reload} compact />
          ) : history.length === 0 ? (
            <EmptyState icon={Activity} title="No history yet" compact>
              Check results will be listed here.
            </EmptyState>
          ) : (
            <>
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <caption className="sr-only">Check history for {website.name}</caption>
                  <thead>
                    <tr className="border-b border-line bg-sunken text-[13px] text-muted">
                      <th scope="col" className="px-5 py-2.5 font-medium">Checked</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Result</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">HTTP</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">Response</th>
                      <th scope="col" className="px-5 py-2.5 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {visibleChecks.map((c) => (
                      <tr key={c.id} className="hover:bg-sunken/60">
                        <td className="whitespace-nowrap px-5 py-2.5 text-muted">{formatDateTimeFull(c.checked_at)}</td>
                        <td className="px-3 py-2.5">
                          <StatusBadge kind={c.is_up ? 'up' : 'down'} />
                        </td>
                        <td className="px-3 py-2.5"><HttpCode code={c.status_code} /></td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{formatMs(c.response_time_ms)}</td>
                        <td className="max-w-[320px] break-words px-5 py-2.5 text-muted">{c.error_message ?? '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {history.length > 20 && (
                <div className="border-t border-line px-5 py-2.5">
                  <Button size="sm" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? 'Show fewer' : `Show all ${history.length}`}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        <Card>
          <CardHeader title="Incidents" description="Opened after two consecutive failed checks; resolved by the next successful check." />
          {incidents.loading ? (
            <div className="p-5" aria-busy="true">
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !incidents.data ? (
            <ErrorState title="Could not load incidents" message={incidents.error ?? 'No data returned.'} onRetry={incidents.reload} compact />
          ) : incidents.data.length === 0 ? (
            <EmptyState icon={Activity} title="No incidents for this website" compact>
              It has not failed two checks in a row.
            </EmptyState>
          ) : (
            <IncidentTable rows={incidents.data.map((i) => ({ ...i, website }))} showWebsite={false} />
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this website?"
        description={
          <>
            <strong className="text-ink">{website.name}</strong> will stop being monitored. Its check history and
            incidents are deleted with it. This cannot be undone.
          </>
        }
        confirmLabel="Delete website"
        loading={deleting === website.id}
        onConfirm={() => void onDelete()}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  )
}
