import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { Segmented } from '@/components/ui/Fields'
import { HttpCode } from '@/components/ui/StatusBadge'
import type { ResponseTimePoint } from '@/types/api'
import { buildResponseChart, type ChartRow, type ResponseChartModel } from '@/utils/chart'
import { formatDateTime, formatMs, formatTime } from '@/utils/format'

const FAIL_COLOR = '#c42a2a'

interface DotProps {
  cx?: number
  cy?: number
  payload?: unknown
  key?: React.Key | null
}

function ChartTooltip({ active, payload, label, model }: TooltipContentProps & { model: ResponseChartModel }) {
  if (!active || !payload?.length) return null
  const entries = payload.filter((p) => typeof p.value === 'number')
  if (!entries.length) return null
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] shadow-pop">
      <p className="mb-1 font-medium text-ink">{formatDateTime(new Date(Number(label)).toISOString())}</p>
      {entries.map((e) => {
        const key = String(e.dataKey)
        const row = e.payload as ChartRow
        const up = row[`${key}:up`]
        const code = row[`${key}:code`]
        const name = model.series.find((s) => s.key === key)?.name ?? e.name
        return (
          <div key={key} className="flex items-center gap-2 text-muted">
            <span className="size-2.5 rounded-sm" style={{ background: e.color }} aria-hidden />
            <span className="text-ink">{name}</span>
            <span className="ml-auto pl-4 font-medium tabular-nums text-ink">{formatMs(e.value as number)}</span>
            {up === false && <span className="font-medium text-down">Failed{typeof code === 'number' ? ` (${code})` : ''}</span>}
          </div>
        )
      })}
    </div>
  )
}

export function ResponseChart({ model, height = 280 }: { model: ResponseChartModel; height?: number }) {
  const { rows, series } = model
  const first = rows[0]?.ts ?? 0
  const last = rows[rows.length - 1]?.ts ?? 0
  const span = last - first
  const tickFormat = (ts: number) => {
    const d = new Date(ts)
    if (span > 36 * 3600_000) return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(d)
    if (span > 15 * 60_000) return formatTime(ts)
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(d)
  }

  return (
    <div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#e6eaf0" vertical={false} />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={tickFormat}
              tick={{ fontSize: 12, fill: '#536175' }}
              tickLine={false}
              axisLine={{ stroke: '#c9d1dd' }}
              minTickGap={56}
            />
            <YAxis
              tickFormatter={(v: number) => formatMs(v)}
              tick={{ fontSize: 12, fill: '#536175' }}
              tickLine={false}
              axisLine={false}
              width={62}
              domain={[0, 'auto']}
            />
            <Tooltip
              cursor={{ stroke: '#9aa6b8', strokeDasharray: '3 3' }}
              content={(props) => <ChartTooltip {...props} model={model} />}
              isAnimationActive={false}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.name}
                type="linear"
                stroke={s.color}
                strokeWidth={2}
                connectNulls
                isAnimationActive={false}
                dot={(props: DotProps) => {
                  const { cx, cy, key } = props
                  const payload = props.payload as ChartRow | undefined
                  if (cx === undefined || cy === undefined || payload?.[`${s.key}:up`] !== false) {
                    return <g key={key ?? undefined} />
                  }
                  return <circle key={key ?? undefined} cx={cx} cy={cy} r={4.5} fill={FAIL_COLOR} stroke="#fff" strokeWidth={2} />
                }}
                activeDot={{ r: 4.5, stroke: '#fff', strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted" aria-label="Chart legend">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="h-[3px] w-4 rounded-full" style={{ background: s.color }} aria-hidden />
            <span className="max-w-[200px] truncate">{s.name}</span>
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border-2 border-white bg-down shadow-[0_0_0_1px_#c42a2a]" aria-hidden />
          Failed check
        </li>
      </ul>
    </div>
  )
}

function ResponseTable({ points }: { points: ResponseTimePoint[] }) {
  const rows = points.slice(0, 100)
  return (
    <div className="relative max-h-[320px] overflow-auto rounded-lg border border-line">
      <table className="w-full min-w-[480px] text-left text-[13px]">
        <caption className="sr-only">Response time samples, newest first</caption>
        <thead className="sticky top-0 bg-sunken text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Checked</th>
            <th scope="col" className="px-3 py-2 font-medium">Website</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Response</th>
            <th scope="col" className="px-3 py-2 font-medium">HTTP</th>
            <th scope="col" className="px-3 py-2 font-medium">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((p, i) => (
            <tr key={`${p.website_id}-${p.checked_at}-${i}`}>
              <td className="whitespace-nowrap px-3 py-1.5 text-muted">{formatDateTime(p.checked_at)}</td>
              <td className="max-w-[200px] truncate px-3 py-1.5">{p.website_name}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatMs(p.response_time_ms)}</td>
              <td className="px-3 py-1.5"><HttpCode code={p.status_code} /></td>
              <td className={`px-3 py-1.5 font-medium ${p.is_up ? 'text-up' : 'text-down'}`}>{p.is_up ? 'Up' : 'Down'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Chart with an accessible table alternative. */
export function ResponseTimeView({ points, height }: { points: ResponseTimePoint[]; height?: number }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const model = useMemo(() => buildResponseChart(points), [points])

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Segmented
          label="Response time view"
          value={view}
          onChange={setView}
          options={[
            { value: 'chart', label: 'Chart' },
            { value: 'table', label: 'Table' },
          ]}
        />
      </div>
      {view === 'chart' ? <ResponseChart model={model} height={height} /> : <ResponseTable points={points} />}
      {model.foldedCount > 0 && view === 'chart' && (
        <p className="mt-2 text-xs text-muted">
          {model.foldedCount} more {model.foldedCount === 1 ? 'website is' : 'websites are'} grouped as “Other websites”.
          Use the table view for each one.
        </p>
      )}
    </div>
  )
}
