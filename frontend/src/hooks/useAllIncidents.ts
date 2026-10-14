import { config } from '@/config'
import { api } from '@/services/api'
import { errorMessage, isAbortError } from '@/services/http'
import { mapWithConcurrency } from '@/utils/concurrency'
import type { Incident, Website } from '@/types/api'
import { useResource } from './useResource'

export interface IncidentRow extends Incident {
  website: Website
}

export interface AllIncidentsData {
  websites: Website[]
  incidents: IncidentRow[]
  failures: { website: Website; message: string }[]
}

/**
 * The backend has no global incident endpoint, so this lists websites and then
 * calls GET /websites/{id}/incidents for each. Failed websites are reported,
 * never silently treated as "no incidents".
 */
export function useAllIncidents() {
  return useResource<AllIncidentsData>(async (signal) => {
    const websites = await api.listWebsites({ signal })
    const results = await mapWithConcurrency(websites, config.fetchConcurrency, async (website) => {
      try {
        const list = await api.getIncidents(website.id, { signal })
        return { website, list, message: null as string | null }
      } catch (error) {
        if (isAbortError(error)) throw error
        return { website, list: [] as Incident[], message: errorMessage(error) }
      }
    })

    const incidents: IncidentRow[] = results.flatMap((r) => r.list.map((i) => ({ ...i, website: r.website })))
    const failures = results.flatMap((r) => (r.message ? [{ website: r.website, message: r.message }] : []))
    return { websites, incidents, failures }
  })
}
