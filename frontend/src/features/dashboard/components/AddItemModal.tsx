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
      <DialogTrigger asChild className="fixed lg:bottom-4 bottom-[70px] right-2">
        <Button>
          <FaPlus />
        </Button>
      </DialogTrigger>
      {/* <DialogContent className="w-full max-h-screen pt-6 sm:pt-1 overflow-y-auto overflow-x-hidden"> */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new item to dashboard</DialogTitle>
          <DialogDescription>Select a device you wish to add to the dashboard.</DialogDescription>
        </DialogHeader>
        <AddItemForm setDialogOpen={setDialogOpen} onAddItem={onAddItem} />
      </DialogContent>
    </Dialog>
  )
}
