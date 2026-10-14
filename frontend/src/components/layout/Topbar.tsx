import { Menu, RefreshCw } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useRefresh } from '@/context/refreshContext'
import { Button, IconButton } from '@/components/ui/Button'
import { useNow } from '@/hooks/useNow'
import { formatRelative } from '@/utils/format'
import { ConnectionIndicator } from './ConnectionIndicator'

interface Crumb {
  label: string
  to?: string
}

function crumbsFor(pathname: string): Crumb[] {
  if (pathname === '/') return [{ label: 'Overview' }]
  if (pathname === '/websites') return [{ label: 'Monitored websites' }]
  if (pathname.startsWith('/websites/'))
    return [{ label: 'Monitored websites', to: '/websites' }, { label: 'Website details' }]
  if (pathname === '/incidents') return [{ label: 'Incidents' }]
  return [{ label: 'Not found' }]
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation()
  const { refresh, isLoading, lastUpdated } = useRefresh()
  const now = useNow(5000)
  const crumbs = crumbsFor(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
      <IconButton label="Open navigation" onClick={onMenu} className="lg:hidden">
        <Menu className="size-5" />
      </IconButton>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1
            return (
              <li key={c.label} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && (
                  <span className="text-subtle" aria-hidden>
                    /
                  </span>
                )}
                {c.to ? (
                  <Link to={c.to} className="truncate text-muted hover:text-ink">
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate font-semibold text-ink" aria-current={last ? 'page' : undefined}>
                    {c.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      <span className="hidden text-[13px] text-muted md:block" aria-live="off">
        {lastUpdated ? `Updated ${formatRelative(new Date(lastUpdated).toISOString(), now)}` : 'Loading…'}
      </span>
      <Button
        size="sm"
        onClick={refresh}
        disabled={isLoading}
        icon={<RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden />}
        aria-label="Refresh data"
      >
        <span className="hidden sm:inline">Refresh</span>
      </Button>
      <ConnectionIndicator />
    </header>
  )
}
