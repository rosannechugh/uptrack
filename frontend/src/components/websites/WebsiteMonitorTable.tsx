import { ExternalLink, Globe, Play, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Input, Select } from '@/components/ui/Fields'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState, Notice } from '@/components/ui/States'
import { HttpCode, StatusBadge } from '@/components/ui/StatusBadge'
import { useWebsiteActions } from '@/hooks/useWebsiteActions'
import { useWebsiteSnapshots } from '@/hooks/useWebsiteSnapshots'
import { formatInterval, formatMs, formatRelative, parseTimestamp, hostOf } from '@/utils/format'
import type { MonitorStatus, WebsiteSnapshot } from '@/utils/status'
import { AddWebsiteButton } from './AddWebsiteButton'
import { HeartbeatStrip } from './HeartbeatStrip'

type StatusFilter = 'all' | MonitorStatus
type SortKey = 'status' | 'name' | 'slowest' | 'recent' | 'newest'

const statusRank: Record<MonitorStatus, number> = { down: 0, unknown: 1, up: 2 }

function sortSnapshots(list: WebsiteSnapshot[], key: SortKey): WebsiteSnapshot[] {
  const out = [...list]
  const checkedAt = (s: WebsiteSnapshot) => (s.latest ? parseTimestamp(s.latest.checked_at).getTime() : -1)
  switch (key) {
    case 'name':
      return out.sort((a, b) => a.website.name.localeCompare(b.website.name))
    case 'slowest':
      return out.sort((a, b) => (b.latest?.response_time_ms ?? -1) - (a.latest?.response_time_ms ?? -1))
    case 'recent':
      return out.sort((a, b) => checkedAt(b) - checkedAt(a))
    case 'newest':
      return out.sort((a, b) => b.website.id - a.website.id)
    default:
      return out.sort(
        (a, b) => statusRank[a.status] - statusRank[b.status] || a.website.name.localeCompare(b.website.name),
      )
  }
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-line" aria-busy="true" aria-label="Loading websites">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="hidden h-4 w-16 md:block" />
        </div>
      ))}
    </div>
  )
}

export function WebsiteMonitorTable({ pageSize = 10 }: { pageSize?: number }) {
  const { data, error, loading, reload } = useWebsiteSnapshots()
  const { checking, deleting, checkNow, remove } = useWebsiteActions()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('status')
  const [page, setPage] = useState(0)
  const [pendingDelete, setPendingDelete] = useState<WebsiteSnapshot | null>(null)

  const all = data?.snapshots

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (all ?? []).filter(
      (s) =>
        (filter === 'all' || s.status === filter) &&
        (!q || s.website.name.toLowerCase().includes(q) || s.website.url.toLowerCase().includes(q)),
    )
    return sortSnapshots(matches, sort)
  }, [all, query, filter, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const rows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const resetPage = () => setPage(0)

  if (loading) return <Card><TableSkeleton /></Card>
  if (error && !data) return <Card><ErrorState message={error} onRetry={reload} /></Card>
  if (!all) return null

  if (all.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Globe}
          title="No websites yet"
          action={<AddWebsiteButton />}
        >
          Add the first website you want to monitor. UpTrack records every check and opens an incident after two
          failed checks in a row.
        </EmptyState>
      </Card>
    )
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const ok = await remove(pendingDelete.website)
    if (ok) setPendingDelete(null)
  }

  return (
    <div className="space-y-3">
      {error && (
        <Notice title="Showing the last data we received" action={<Button size="sm" onClick={reload}>Retry</Button>}>
          The latest refresh failed: {error}
        </Notice>
      )}
      {data && data.failed.length > 0 && (
        <Notice title={`Check history unavailable for ${data.failed.length} of ${all.length} websites`}>
          {data.failed.map((f) => f.website.name).join(', ')}. Their status shows as not checked because it cannot be
          confirmed.
        </Notice>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <Input
              type="search"
              aria-label="Search websites"
              placeholder="Search by name or URL"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                resetPage()
              }}
              className="h-8 pl-8 text-[13px]"
            />
          </div>
          <Select
            label="Status"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as StatusFilter)
              resetPage()
            }}
          >
            <option value="all">All</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="unknown">Not checked</option>
          </Select>
          <Select label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="status">Problems first</option>
            <option value="name">Name</option>
            <option value="slowest">Slowest response</option>
            <option value="recent">Recently checked</option>
            <option value="newest">Newest added</option>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Search} title="No websites match" compact>
            Try a different search or status filter.
          </EmptyState>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Monitored websites and their latest check results</caption>
              <thead>
                <tr className="border-b border-line bg-sunken text-[13px] text-muted">
                  <th scope="col" className="px-4 py-2.5 font-medium">Website</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                  <th scope="col" className="hidden px-3 py-2.5 font-medium md:table-cell">Recent checks</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Response</th>
                  <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">HTTP</th>
                  <th scope="col" className="hidden px-3 py-2.5 font-medium xl:table-cell">Interval</th>
                  <th scope="col" className="hidden px-3 py-2.5 font-medium lg:table-cell">Last check</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((s) => {
                  const { website, latest } = s
                  const busy = checking.has(website.id)
                  return (
                    <tr key={website.id} className="align-middle hover:bg-sunken/60">
                      <td className="max-w-[280px] px-4 py-3">
                        <Link
                          to={`/websites/${website.id}`}
                          className="block truncate font-medium text-ink hover:text-accent"
                        >
                          {website.name}
                        </Link>
                        <a
                          href={website.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex max-w-full items-center gap-1 text-[13px] text-muted hover:text-accent"
                        >
                          <span className="truncate font-mono text-xs">{hostOf(website.url)}</span>
                          <ExternalLink className="size-3 shrink-0" aria-hidden />
                          <span className="sr-only">Open {website.url} in a new tab</span>
                        </a>
                      </td>
                      <td className="px-3 py-3">
                        {s.checksError ? (
                          <StatusBadge kind="error" label="History unavailable" />
                        ) : (
                          <StatusBadge kind={s.status} />
                        )}
                        {!website.is_active && <span className="ml-1.5 text-xs text-subtle">Inactive</span>}
                      </td>
                      <td className="hidden px-3 py-3 md:table-cell">
                        {s.checks ? <HeartbeatStrip checks={s.checks} /> : <span className="text-subtle">–</span>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatMs(latest?.response_time_ms)}</td>
                      <td className="hidden px-3 py-3 sm:table-cell">
                        <HttpCode code={latest?.status_code ?? null} />
                      </td>
                      <td className="hidden px-3 py-3 text-muted xl:table-cell">
                        {formatInterval(website.check_interval_seconds)}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-muted lg:table-cell">
                        {latest ? formatRelative(latest.checked_at) : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <IconButton
                            label={busy ? `Checking ${website.name}` : `Check ${website.name} now`}
                            onClick={() => void checkNow(website)}
                            disabled={busy}
                          >
                            <Play className={`size-4 ${busy ? 'animate-pulse text-accent' : ''}`} />
                          </IconButton>
                          <IconButton
                            label={`Delete ${website.name}`}
                            onClick={() => setPendingDelete(s)}
                            className="hover:!bg-down-soft hover:!text-down"
                          >
                            <Trash2 className="size-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > pageSize && (
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[13px] text-muted">
            <span>
              {safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <Button size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                Previous
              </Button>
              <Button size="sm" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this website?"
        description={
          <>
            <strong className="text-ink">{pendingDelete?.website.name}</strong> will stop being monitored. Its check
            history and incidents are deleted with it. This cannot be undone.
          </>
        }
        confirmLabel="Delete website"
        loading={deleting !== null}
        onConfirm={() => void confirmDelete()}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  )
}
