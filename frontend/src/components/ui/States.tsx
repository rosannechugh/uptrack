import { AlertCircle, ServerCrash, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function ErrorState({
  title = 'Could not load this data',
  message,
  onRetry,
  compact = false,
}: {
  title?: string
  message: string
  onRetry?: () => void
  compact?: boolean
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-down-soft text-down">
        <ServerCrash className="size-5" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-md break-words text-sm text-muted">{message}</p>
      {onRetry && (
        <Button className="mt-4" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  compact = false,
}: {
  icon: LucideIcon
  title: string
  children?: ReactNode
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}>
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {children && <p className="mt-1 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Inline notice for partial failures and stale data. */
export function Notice({
  tone = 'warn',
  title,
  children,
  action,
}: {
  tone?: 'warn' | 'info'
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  const palette = tone === 'warn' ? 'border-[#f0d49a] bg-warn-soft text-[#6b3a00]' : 'border-[#bcd2f6] bg-accent-soft text-[#143b86]'
  return (
    <div role="status" className={`flex flex-wrap items-start gap-3 rounded-lg border px-4 py-3 text-sm ${palette}`}>
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {children && <div className="mt-0.5 break-words opacity-90">{children}</div>}
      </div>
      {action}
    </div>
  )
}
