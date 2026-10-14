import { createContext, useContext } from 'react'

export interface RefreshContextValue {
  /** Increments whenever data should be re-fetched (manual, auto, mutation). */
  version: number
  /** Re-fetch everything that is currently mounted. */
  refresh: () => void
  /** True while any registered resource is loading. */
  isLoading: boolean
  /** Epoch ms of the last successful fetch by any resource. */
  lastUpdated: number | null
  reportLoading: (delta: 1 | -1) => void
  markUpdated: () => void
}

export const RefreshContext = createContext<RefreshContextValue | null>(null)

export function useRefresh(): RefreshContextValue {
  const ctx = useContext(RefreshContext)
  if (!ctx) throw new Error('useRefresh must be used inside <RefreshProvider>')
  return ctx
}
