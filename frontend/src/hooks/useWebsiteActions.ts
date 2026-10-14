import { useCallback, useState } from 'react'
import { useRefresh } from '@/context/refreshContext'
import { useToast } from '@/context/toastContext'
import { api } from '@/services/api'
import { errorMessage } from '@/services/http'
import type { CheckResult, Website } from '@/types/api'
import { formatMs } from '@/utils/format'
import { describeCheck } from '@/utils/status'

/** Check-now and delete, shared by the table and the details page. */
export function useWebsiteActions() {
  const toast = useToast()
  const { refresh } = useRefresh()
  const [checking, setChecking] = useState<ReadonlySet<number>>(new Set())
  const [deleting, setDeleting] = useState<number | null>(null)

  const checkNow = useCallback(
    async (website: Pick<Website, 'id' | 'name'>): Promise<CheckResult | null> => {
      setChecking((s) => new Set(s).add(website.id))
      try {
        const result = await api.runCheck(website.id)
        // The toast reports what the backend returned, not what we expect.
        if (result.is_up) toast.success(`${website.name} is up`, `Responded in ${formatMs(result.response_time_ms)}.`)
        else toast.error(`${website.name} is down`, describeCheck(result))
        refresh()
        return result
      } catch (error) {
        toast.error(`Check failed for ${website.name}`, errorMessage(error))
        return null
      } finally {
        setChecking((s) => {
          const next = new Set(s)
          next.delete(website.id)
          return next
        })
      }
    },
    [toast, refresh],
  )

  const remove = useCallback(
    async (website: Pick<Website, 'id' | 'name'>): Promise<boolean> => {
      setDeleting(website.id)
      try {
        await api.deleteWebsite(website.id)
        toast.success('Website deleted', `${website.name} and its history were removed.`)
        refresh()
        return true
      } catch (error) {
        toast.error(`Could not delete ${website.name}`, errorMessage(error))
        return false
      } finally {
        setDeleting(null)
      }
    },
    [toast, refresh],
  )

  return { checking, deleting, checkNow, remove }
}
