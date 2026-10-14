import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { limits } from '@/config'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input } from '@/components/ui/Fields'
import { useRefresh } from '@/context/refreshContext'
import { useToast } from '@/context/toastContext'
import { api } from '@/services/api'
import { ApiError, errorMessage } from '@/services/http'
import { describeCheck } from '@/utils/status'
import { formatMs } from '@/utils/format'
import { websiteFormSchema, type WebsiteFormInput } from '@/utils/validation'

export function AddWebsiteDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated?: (id: number) => void
}) {
  const toast = useToast()
  const { refresh } = useRefresh()

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WebsiteFormInput>({
    resolver: zodResolver(websiteFormSchema),
    defaultValues: {
      name: '',
      url: '',
      check_interval_seconds: limits.intervalDefault,
      run_first_check: true,
    },
  })

  const close = () => {
    if (isSubmitting) return
    reset()
    onClose()
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await api.createWebsite({
        name: values.name,
        url: values.url,
        check_interval_seconds: values.check_interval_seconds,
      })
      toast.success('Website added', `${created.name} will be checked every ${created.check_interval_seconds} seconds.`)
      reset()
      onClose()
      refresh()
      onCreated?.(created.id)

      if (values.run_first_check) {
        try {
          const check = await api.runCheck(created.id)
          refresh()
          if (check.is_up) toast.success(`${created.name} is up`, `First check answered in ${formatMs(check.response_time_ms)}.`)
          else toast.error(`${created.name} is down`, describeCheck(check))
        } catch (error) {
          toast.error('First check failed to run', errorMessage(error))
        }
      }
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field === 'name' || field === 'url' || field === 'check_interval_seconds') {
            setError(field, { message })
          }
        }
      }
      toast.error('Could not add website', errorMessage(error))
    }
  })

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Add a website"
      description="UpTrack will request this URL on a schedule and record the result."
      dismissible={!isSubmitting}
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="space-y-4 px-5 py-5">
          <Field label="Name" htmlFor="site-name" error={errors.name?.message}>
            <Input
              id="site-name"
              placeholder="Marketing site"
              autoComplete="off"
              autoFocus
              invalid={!!errors.name}
              describedBy={errors.name ? 'site-name-error' : undefined}
              {...register('name')}
            />
          </Field>
          <Field label="URL" htmlFor="site-url" error={errors.url?.message} hint="Include http:// or https://.">
            <Input
              id="site-url"
              type="url"
              inputMode="url"
              placeholder="https://example.com"
              autoComplete="off"
              invalid={!!errors.url}
              describedBy={errors.url ? 'site-url-error' : 'site-url-hint'}
              {...register('url')}
            />
          </Field>
          <Field
            label="Check interval (seconds)"
            htmlFor="site-interval"
            error={errors.check_interval_seconds?.message}
            hint={`Between ${limits.intervalMin} and ${limits.intervalMax} seconds.`}
          >
            <Input
              id="site-interval"
              type="number"
              inputMode="numeric"
              min={limits.intervalMin}
              max={limits.intervalMax}
              invalid={!!errors.check_interval_seconds}
              describedBy={errors.check_interval_seconds ? 'site-interval-error' : 'site-interval-hint'}
              {...register('check_interval_seconds', { valueAsNumber: true })}
            />
          </Field>
          <label className="flex items-start gap-2.5 text-sm text-ink">
            <input type="checkbox" className="mt-0.5 size-4 accent-accent" {...register('run_first_check')} />
            <span>
              Run the first check now
              <span className="block text-[13px] text-muted">
                Otherwise the first check runs after one full interval and the site shows as not checked until then.
              </span>
            </span>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-line bg-sunken px-5 py-3">
          <Button onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add website'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
