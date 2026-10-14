import { createContext, useContext } from 'react'

export type HealthState = 'checking' | 'healthy' | 'database-down' | 'unreachable'

export interface HealthContextValue {
  state: HealthState
  detail: string | null
  checkedAt: number | null
  recheck: () => void
}

export const HealthContext = createContext<HealthContextValue | null>(null)

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext)
  if (!ctx) throw new Error('useHealth must be used inside <HealthProvider>')
  return ctx
}
