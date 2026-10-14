import { useCallback, useEffect, useEffectEvent, useState, type DependencyList } from 'react'
import { useRefresh } from '@/context/refreshContext'
import { ApiError, errorMessage, isAbortError } from '@/services/http'

export interface ResourceState<T> {
  data: T | null
  /** Message of the most recent failure. `data` may still hold older results. */
  error: string | null
  /** HTTP status of the failure, when the API answered (e.g. 404). */
  errorStatus: number | null
  /** First load, with nothing to show yet. */
  loading: boolean
  /** A re-fetch is in flight while older data is still displayed. */
  refreshing: boolean
  reload: () => void
}

interface Internal<T> {
  data: T | null
  error: string | null
  errorStatus: number | null
  status: 'loading' | 'refreshing' | 'idle'
}

/**
 * Fetches data with cancellation and stale-response protection. Each run owns
 * an AbortController; cleanup aborts it and a late response from a superseded
 * run is ignored. Re-runs when `deps` change, when the global refresh version
 * changes (manual button, auto-refresh, mutations), or when reload() is called.
 */
export function useResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList = [],
): ResourceState<T> {
  const { version, reportLoading, markUpdated } = useRefresh()
  const [localVersion, setLocalVersion] = useState(0)
  const [state, setState] = useState<Internal<T>>({ data: null, error: null, errorStatus: null, status: 'loading' })

  const run = useEffectEvent((signal: AbortSignal) => fetcher(signal))

  useEffect(() => {
    const controller = new AbortController()
    let current = true

    // Flipping the status flag as a fetch starts is the sync point with the network.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({ ...s, status: s.data === null ? 'loading' : 'refreshing' }))
    reportLoading(1)

    run(controller.signal)
      .then((data) => {
        if (!current) return
        setState({ data, error: null, errorStatus: null, status: 'idle' })
        markUpdated()
      })
      .catch((error: unknown) => {
        if (!current || isAbortError(error)) return
        setState((s) => ({
          data: s.data,
          error: errorMessage(error),
          errorStatus: error instanceof ApiError ? error.status : null,
          status: 'idle',
        }))
      })
      .finally(() => reportLoading(-1))

    return () => {
      current = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, localVersion, reportLoading, markUpdated, ...deps])

  const reload = useCallback(() => setLocalVersion((v) => v + 1), [])

  return {
    data: state.data,
    error: state.error,
    errorStatus: state.errorStatus,
    loading: state.status === 'loading' && state.data === null,
    refreshing: state.status === 'refreshing',
    reload,
  }
}
