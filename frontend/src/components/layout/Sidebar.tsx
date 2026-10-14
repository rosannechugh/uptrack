import { Activity, AlertTriangle, Globe, LayoutDashboard, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'

const items = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/websites', label: 'Monitored websites', icon: Globe, end: false },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle, end: false },
]

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex-1 px-3 py-4">
      <ul className="space-y-0.5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-nav-raised text-white shadow-[inset_2px_0_0_#5b97ff]'
                    : 'text-nav-ink/80 hover:bg-nav-raised/60 hover:text-white'
                }`
              }
            >
              <Icon className="size-[18px] shrink-0" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Footer() {
  return (
    <div className="border-t border-nav-line px-5 py-4 text-xs text-nav-muted">
      <p className="flex items-center gap-1.5">
        <Activity className="size-3.5" aria-hidden />
        Checks run server-side
      </p>
      <p className="mt-1">Up means an HTTP response from 200 to 399 within 10 seconds.</p>
    </div>
  )
}

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-nav lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <Nav />
        <Footer />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-[#0a1424]/60" onClick={onClose} aria-hidden />
          <aside
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-nav shadow-pop"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="flex h-16 items-center justify-between px-5">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation"
                className="rounded-md p-1.5 text-nav-ink hover:bg-nav-raised"
              >
                <X className="size-5" />
              </button>
            </div>
            <Nav onNavigate={onClose} />
            <Footer />
          </aside>
        </div>
      )}
    </>
  )
}
