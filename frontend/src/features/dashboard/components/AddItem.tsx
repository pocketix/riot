import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FaPlus } from 'react-icons/fa6'
import { AddItemForm } from './AddItemForm'
import { useState } from 'react'

export interface AddItemModalProps {
  onAddItem: (item: any) => void
}

export function AddItemModal({ onAddItem }: AddItemModalProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(!dialogOpen)}>
      <DialogTrigger asChild className="fixed bottom-4 right-4">
        <Button>
          <FaPlus />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:w-fit max-h-[80vh] p-1 sm:p-6 overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Add new item to dashboard</DialogTitle>
          <DialogDescription>Select a device you wish to add to the dashboard.</DialogDescription>
        </DialogHeader>
        <AddItemForm setDialogOpen={setDialogOpen} onAddItem={onAddItem} />
      </DialogContent>
    </Dialog>
  )
}
