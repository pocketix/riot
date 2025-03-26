import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TbTrash, TbX } from 'react-icons/tb'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[23rem] p-4 sm:max-w-max">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>

        {/* Add Description for Accessibility */}
        <DialogDescription>
          Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be undone.
        </DialogDescription>

        <DialogFooter className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline">
            <TbX className="mr-2" /> Cancel
          </Button>
          <Button onClick={onConfirm} variant="destructive">
            <TbTrash className="mr-2" /> Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
