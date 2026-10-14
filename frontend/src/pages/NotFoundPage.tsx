import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'

export function NotFoundState({ title = 'Page not found', message }: { title?: string; message?: string }) {
  return (
    <Card>
      <EmptyState
        icon={Compass}
        title={title}
        action={
          <Link to="/websites">
            <Button variant="primary">Back to websites</Button>
          </Link>
        }
      >
        {message ?? 'The address you opened does not match any page in UpTrack.'}
      </EmptyState>
    </Card>
  )
}

export function NotFoundPage() {
  return <NotFoundState />
}
