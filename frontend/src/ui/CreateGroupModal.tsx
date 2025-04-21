import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TbCheck, TbX } from 'react-icons/tb'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (userIdentifier: string) => void
  selectedDeviceNames?: string[]
}

export default function CreateGroupModal({ isOpen, onClose, onConfirm, selectedDeviceNames }: CreateGroupModalProps) {
  const [identifier, setIdentifier] = useState('')

  const handleConfirm = () => {
    if (identifier.trim()) {
      onConfirm(identifier.trim())
      setIdentifier('')
    }
  }

  const handleClose = () => {
    setIdentifier('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[23rem] p-4 sm:max-w-max">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
        </DialogHeader>

        <DialogDescription>Please enter a user identifier for the new group.</DialogDescription>

        {selectedDeviceNames && selectedDeviceNames.length > 0 && (
          <div className="mb-2 text-sm text-muted-foreground">
            <p className="mb-1 font-semibold">Selected Devices:</p>
            <ul className="list-disc space-y-1 pl-5">
              {selectedDeviceNames.map((name, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
          </div>
        )}

        <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Enter identifier" />

        <DialogFooter className="flex justify-end gap-2">
          <Button onClick={handleClose} variant="outline">
            <TbX className="mr-2" /> Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!identifier.trim()}>
            <TbCheck className="mr-2" /> Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
