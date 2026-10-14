import { z } from 'zod'
import { limits } from '@/config'

/** Mirrors WebsiteCreate in backend/app/schemas.py. */
export const websiteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name for this website.')
    .max(limits.nameMaxLength, `Use ${limits.nameMaxLength} characters or fewer.`),
  url: z
    .string()
    .trim()
    .min(1, 'Enter the website URL.')
    .refine((value) => {
      try {
        const parsed = new URL(value)
        return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0
      } catch {
        return false
      }
    }, 'Enter a full URL starting with http:// or https://.'),
  check_interval_seconds: z
    .number({ error: 'Enter the interval in seconds.' })
    .int('Use a whole number of seconds.')
    .min(limits.intervalMin, `Use at least ${limits.intervalMin} seconds.`)
    .max(limits.intervalMax, `Use ${limits.intervalMax} seconds or fewer.`),
})

export type WebsiteFormValues = z.infer<typeof websiteSchema>

/** The dialog adds one UI-only field that is never sent to the API. */
export const websiteFormSchema = websiteSchema.extend({ run_first_check: z.boolean() })
export type WebsiteFormInput = z.infer<typeof websiteFormSchema>
