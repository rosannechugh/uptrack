import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { config } from '@/config'
import { api } from '@/services/api'
import { ApiError, isAbortError } from '@/services/http'
import { HealthContext, type HealthContextValue, type HealthState } from './healthContext'

type Snapshot = Pick<HealthContextValue, 'state' | 'detail' | 'checkedAt'>

export function HealthProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ state: 'checking', detail: null, checkedAt: null })
  const [tick, setTick] = useState(0)
  const recheck = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    const set = (state: HealthState, detail: string | null) =>
      setSnapshot({ state, detail, checkedAt: Date.now() })

    const poll = async () => {
      try {
        const res = await api.health({ signal: controller.signal })
        if (res.status === 'healthy' && res.database === 'connected') set('healthy', null)
        else set('database-down', `Reported status "${res.status}", database "${res.database}".`)
      } catch (error) {
        if (isAbortError(error) || controller.signal.aborted) return
        if (error instanceof ApiError && error.kind === 'http' && error.status !== null && ![502, 503, 504].includes(error.status)) {
          // The API answered, but the /health database query raised an error.
          set('database-down', 'The API is running, but its database check failed.')
        } else {
          set('unreachable', error instanceof Error ? error.message : 'Cannot reach the API.')
        }
      }
    }

    void poll()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void poll()
    }, config.healthPollMs)
    return () => {
      clearInterval(timer)
      controller.abort()
    }
  }, [tick])

  const value = useMemo(() => ({ ...snapshot, recheck }), [snapshot, recheck])
  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
}
