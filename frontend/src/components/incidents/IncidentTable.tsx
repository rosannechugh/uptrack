import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { IncidentRow } from '@/hooks/useAllIncidents'
import { useNow } from '@/hooks/useNow'
import { formatDateTime, formatDuration } from '@/utils/format'

export function IncidentBadge({ status }: { status: string }) {
  if (status === 'open') return <StatusBadge kind="open" />
  if (status === 'resolved') return <StatusBadge kind="resolved" />
  return <StatusBadge kind="error" label={status} />
}

export function IncidentTable({ rows, showWebsite = true }: { rows: IncidentRow[]; showWebsite?: boolean }) {
  const now = useNow(30_000)
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <caption className="sr-only">Incidents</caption>
        <thead>
          <tr className="border-b border-line bg-sunken text-[13px] text-muted">
            <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
            {showWebsite && <th scope="col" className="px-3 py-2.5 font-medium">Website</th>}
            <th scope="col" className="px-3 py-2.5 font-medium">Description</th>
            <th scope="col" className="whitespace-nowrap px-3 py-2.5 font-medium">Started</th>
            <th scope="col" className="whitespace-nowrap px-3 py-2.5 font-medium">Resolved</th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((i) => (
            <tr key={`${i.website_id}-${i.id}`} className="align-top hover:bg-sunken/60">
              <td className="px-4 py-3"><IncidentBadge status={i.status} /></td>
              {showWebsite && (
                <td className="max-w-[200px] px-3 py-3">
                  <Link to={`/websites/${i.website.id}`} className="block truncate font-medium hover:text-accent">
                    {i.website.name}
                  </Link>
                </td>
              )}
              <td className="max-w-[360px] break-words px-3 py-3 text-muted">{i.description}</td>
              <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDateTime(i.started_at)}</td>
              <td className="whitespace-nowrap px-3 py-3 text-muted">
                {i.resolved_at ? formatDateTime(i.resolved_at) : <span className="text-down">Ongoing</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                {formatDuration(i.started_at, i.resolved_at, now)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
