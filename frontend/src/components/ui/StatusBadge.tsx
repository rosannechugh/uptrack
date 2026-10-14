import { AlertTriangle, CheckCircle2, CircleHelp, XCircle, type LucideIcon } from 'lucide-react'
import type { MonitorStatus } from '@/utils/status'

interface Tone {
  label: string
  className: string
  Icon: LucideIcon
}

const tones: Record<MonitorStatus | 'open' | 'resolved' | 'error', Tone> = {
  up: { label: 'Up', className: 'bg-up-soft text-up', Icon: CheckCircle2 },
  down: { label: 'Down', className: 'bg-down-soft text-down', Icon: XCircle },
  unknown: { label: 'Not checked', className: 'bg-unknown-soft text-unknown', Icon: CircleHelp },
  open: { label: 'Open', className: 'bg-down-soft text-down', Icon: AlertTriangle },
  resolved: { label: 'Resolved', className: 'bg-up-soft text-up', Icon: CheckCircle2 },
  error: { label: 'Unavailable', className: 'bg-warn-soft text-warn', Icon: AlertTriangle },
}

export type BadgeKind = keyof typeof tones

/** Status is always icon + text, never colour alone. */
export function StatusBadge({ kind, label }: { kind: BadgeKind; label?: string }) {
  const { label: defaultLabel, className, Icon } = tones[kind]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {label ?? defaultLabel}
    </span>
  )
}

export function HttpCode({ code }: { code: number | null }) {
  if (code === null) return <span className="text-subtle">–</span>
  const tone = code < 400 ? 'text-up' : code < 500 ? 'text-warn' : 'text-down'
  return <span className={`font-mono text-[13px] ${tone}`}>{code}</span>
}
