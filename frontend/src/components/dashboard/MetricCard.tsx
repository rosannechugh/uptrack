import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export function MetricCard({
  label,
  value,
  note,
  tone = 'neutral',
  to,
}: {
  label: string
  value: ReactNode
  note?: string
  tone?: 'neutral' | 'up' | 'down' | 'unknown'
  to?: string
}) {
  const dot = { neutral: 'bg-accent', up: 'bg-up', down: 'bg-down', unknown: 'bg-subtle' }[tone]
  const body = (
    <Card className={`h-full p-4 ${to ? 'transition-colors hover:border-line-strong hover:bg-sunken/60' : ''}`}>
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <span className={`size-2 rounded-full ${dot}`} aria-hidden />
        {label}
      </div>
      <div className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-ink tabular-nums">{value}</div>
      {note && <p className="mt-2 text-xs text-muted">{note}</p>}
    </Card>
  )
  return to ? (
    <Link to={to} className="block rounded-xl">
      {body}
    </Link>
  ) : (
    body
  )
}

export function MetricCardSkeleton() {
  return (
    <Card className="p-4" aria-hidden>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-7 w-16" />
      <Skeleton className="mt-3 h-3 w-28" />
    </Card>
  )
}
