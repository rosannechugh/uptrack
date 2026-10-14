import { Link } from 'react-router-dom'
import { OverviewMetrics } from '@/components/dashboard/OverviewMetrics'
import { ResponseTimePanel } from '@/components/dashboard/ResponseTimePanel'
import { UptimePanel } from '@/components/dashboard/UptimePanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { AddWebsiteButton } from '@/components/websites/AddWebsiteButton'
import { WebsiteMonitorTable } from '@/components/websites/WebsiteMonitorTable'

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Live status of every monitored website, from the checks UpTrack has recorded."
        actions={<AddWebsiteButton />}
      />
      <div className="space-y-6">
        <OverviewMetrics />

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <UptimePanel />
          <ResponseTimePanel />
        </div>

        <section aria-labelledby="sites-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="sites-heading" className="text-[15px] font-semibold">
              Websites
            </h2>
            <Link to="/websites" className="text-[13px] font-medium text-accent hover:underline">
              Open full list
            </Link>
          </div>
          <WebsiteMonitorTable pageSize={8} />
        </section>
      </div>
    </>
  )
}
