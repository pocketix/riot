import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from '@/components/ui/drawer'
import { FaPlus } from 'react-icons/fa6'
import { AddItemForm } from './AddItemForm'
import { useEffect, useState } from 'react'
import { GridItem, AllConfigTypes } from '@/types/dashboard/gridItem'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tab } from '@/schemas/dashboard/DashboardSchema'

export interface AddItemModalProps {
  onAddItem<ConfigType extends AllConfigTypes>(item: GridItem<ConfigType>): void
  triggerOpen?: boolean
  onDialogOpenChange?: (open: boolean) => void
  tabs: Tab[]
  activeTabID: number
  currentBreakpoint: string
}

export function AddItemModal({
  onAddItem,
  triggerOpen = false,
  onDialogOpenChange,
  tabs,
  activeTabID,
  currentBreakpoint
}: AddItemModalProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    if (triggerOpen !== dialogOpen) {
      setDialogOpen(triggerOpen)
    }
  }, [triggerOpen])

  const handleAddItem = <ConfigType extends AllConfigTypes>(item: GridItem<ConfigType>) => {
    onAddItem(item)
    handleOpenChange(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setDialogOpen(isOpen)
    if (onDialogOpenChange) {
      onDialogOpenChange(isOpen)
    }
  }

  const trigger = (
    <DialogTrigger asChild className="z-2 fixed bottom-[80px] right-4 lg:bottom-4">
      <Button>
        <FaPlus />
      </Button>
    </DialogTrigger>
  )

  const modalContent = (
    <>
      <DialogHeader>
        <DialogTitle>Add new item to dashboard</DialogTitle>
        <DialogDescription>Select a device you wish to add to the dashboard.</DialogDescription>
      </DialogHeader>
      <AddItemForm
        onAddItem={handleAddItem}
        setDialogOpen={handleOpenChange}
        tabs={tabs}
        activeTabID={activeTabID}
        currentBreakpoint={currentBreakpoint}
      />
    </>
  )

  return isDesktop ? (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger}
      <DialogContent>{modalContent}</DialogContent>
    </Dialog>
  ) : (
    <Drawer open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger}
      <DrawerContent>
        <ScrollArea>
          <div className="h-fit max-h-[calc(95vh-2rem)] sm:p-4">
            <DrawerHeader>
              <DrawerTitle>Add new item to dashboard</DrawerTitle>
              <DrawerDescription>Select a device you wish to add to the dashboard.</DrawerDescription>
            </DrawerHeader>
            <AddItemForm
              onAddItem={handleAddItem}
              setDialogOpen={handleOpenChange}
              tabs={tabs}
              activeTabID={activeTabID}
              currentBreakpoint={currentBreakpoint}
            />
            <DrawerFooter className="pt-4">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}
