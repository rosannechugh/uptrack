import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AddWebsiteDialog } from './AddWebsiteDialog'

export function AddWebsiteButton({ variant = 'primary' }: { variant?: 'primary' | 'secondary' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant={variant} icon={<Plus className="size-4" aria-hidden />} onClick={() => setOpen(true)}>
        Add website
      </Button>
      <AddWebsiteDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}
