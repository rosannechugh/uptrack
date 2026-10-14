import { PageHeader } from '@/components/ui/PageHeader'
import { AddWebsiteButton } from '@/components/websites/AddWebsiteButton'
import { WebsiteMonitorTable } from '@/components/websites/WebsiteMonitorTable'

export function WebsitesPage() {
  return (
    <>
      <PageHeader
        title="Monitored websites"
        description="Status comes from each website’s most recent check. A website that has never been checked is shown as not checked."
        actions={<AddWebsiteButton />}
      />
      <WebsiteMonitorTable pageSize={15} />
    </>
  )
}
