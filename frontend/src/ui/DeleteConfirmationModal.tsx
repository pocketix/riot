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
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[23rem] p-4 sm:max-w-max">
        <DialogHeader>
          <DialogTitle>{t('confirmDeletion')}</DialogTitle>
        </DialogHeader>

        {/* Add Description for Accessibility */}
        <DialogDescription>{t('confirmDeletePrompt', { item: itemName })}</DialogDescription>

        <DialogFooter className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline">
            <TbX className="mr-2" /> {t('cancel')}
          </Button>
          <Button onClick={onConfirm} variant="destructive">
            <TbTrash className="mr-2" /> {t('confirmDelete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
