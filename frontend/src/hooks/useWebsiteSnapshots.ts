import { config } from '@/config'
import { api } from '@/services/api'
import { errorMessage, isAbortError } from '@/services/http'
import { mapWithConcurrency } from '@/utils/concurrency'
import { buildSnapshot, type WebsiteSnapshot } from '@/utils/status'
import { useResource } from './useResource'

export interface SnapshotsData {
  snapshots: WebsiteSnapshot[]
  /** Websites whose check history could not be loaded. */
  failed: WebsiteSnapshot[]
}

/**
 * Websites plus each one's recent checks. The list endpoint carries no check
 * data, so this calls GET /websites/{id}/checks?limit=N per website (bounded
 * concurrency). One failure does not fail the rest.
 */
export function useWebsiteSnapshots() {
  return useResource<SnapshotsData>(async (signal) => {
    const websites = await api.listWebsites({ signal })
    const snapshots = await mapWithConcurrency(websites, config.fetchConcurrency, async (website) => {
      try {
        const checks = await api.getChecks(website.id, config.heartbeatChecks, { signal })
        return buildSnapshot(website, checks, null)
      } catch (error) {
        if (isAbortError(error)) throw error
        return buildSnapshot(website, null, errorMessage(error))
      }
    })
    return { snapshots, failed: snapshots.filter((s) => s.checksError !== null) }
  })
}
