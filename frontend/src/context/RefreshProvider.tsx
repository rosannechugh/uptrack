import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { config } from '@/config'
import { RefreshContext } from './refreshContext'

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const [pending, setPending] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const refresh = useCallback(() => setVersion((v) => v + 1), [])
  const reportLoading = useCallback((delta: 1 | -1) => setPending((p) => Math.max(0, p + delta)), [])
  const markUpdated = useCallback(() => setLastUpdated(Date.now()), [])

  // Poll only while the tab is visible, and refresh once when it becomes visible again.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    const start = () => {
      stop()
      timer = setInterval(refresh, config.autoRefreshMs)
    }
    const stop = () => {
      if (timer) clearInterval(timer)
      timer = undefined
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh()
        start()
      } else {
        stop()
      }
    }
    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refresh])

  const value = useMemo(
    () => ({ version, refresh, isLoading: pending > 0, lastUpdated, reportLoading, markUpdated }),
    [version, refresh, pending, lastUpdated, reportLoading, markUpdated],
  )
  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>
}
