import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ChartCardConfig } from '@/schemas/dashboard/visualizations/LineChartBuilderSchema'
import { EntityCardConfig } from '@/schemas/dashboard/visualizations/EntityCardBuilderSchema'
import { TableCardConfig } from '@/schemas/dashboard/visualizations/TableBuilderSchema'
import { BulletCardConfig } from '@/schemas/dashboard/visualizations/BulletChartBuilderSchema'
import { toast } from 'sonner'
import { DialogDescription } from '@radix-ui/react-dialog'
import { AllConfigTypes, BuilderResult } from '@/types/dashboard/gridItem'
import { LineChartBuilderController } from '../builders/LineChartBuidlerController'
import { BulletChartBuilderController } from '../builders/BulletChartBuilderController'
import { EntityCardBuilderController } from '../builders/EntityCardBuilderController'
import { TableCardBuilderController } from '../builders/TableCardBuilderController'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Pencil } from 'lucide-react'
import { SwitchCardBuilderController } from '../builders/SwitchCardBuilderController'
import { SwitchCardConfig } from '@/schemas/dashboard/visualizations/SwitchBuilderSchema'
import { SequentialStatesBuilderController } from '../builders/SequentialStatesBuilderController'
import { SequentialStatesCardConfig } from '@/schemas/dashboard/visualizations/SequentialStatesBuilderSchema'

export interface CardEditDialogProps<ConfigType extends AllConfigTypes> {
  config?: ConfigType
  visualizationType: 'line' | 'switch' | 'table' | 'bullet' | 'entitycard' | 'seqstates'
  onSave: (result: BuilderResult<ConfigType>) => void
}

export function CardEditDialog<ConfigType extends AllConfigTypes>({
  config,
  visualizationType,
  onSave
}: CardEditDialogProps<ConfigType>) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const handleSave = (result: BuilderResult<ConfigType>) => {
    onSave(result)
    setDialogOpen(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setDialogOpen(isOpen)
  }

  const renderBuilder = () => {
    switch (visualizationType) {
      case 'line':
        return (
          <LineChartBuilderController
            config={config as ChartCardConfig}
            onDataSubmit={(data: BuilderResult<ChartCardConfig>) => handleSave(data as BuilderResult<ConfigType>)}
          />
        )
      case 'switch':
        return (
          <SwitchCardBuilderController
            config={config as SwitchCardConfig}
            onDataSubmit={(data: BuilderResult<SwitchCardConfig>) => handleSave(data as BuilderResult<ConfigType>)}
          />
        )
      case 'table':
        return (
          <TableCardBuilderController
            config={config as TableCardConfig}
            onDataSubmit={(data: BuilderResult<TableCardConfig>) => handleSave(data as BuilderResult<ConfigType>)}
          />
        )
      case 'bullet':
        return (
          <BulletChartBuilderController
            config={config as BulletCardConfig}
            onDataSubmit={(data: BuilderResult<BulletCardConfig>) => handleSave(data as BuilderResult<ConfigType>)}
          />
        )
      case 'entitycard':
        return (
          <EntityCardBuilderController
            config={config as EntityCardConfig}
            onDataSubmit={(data: BuilderResult<EntityCardConfig>) => handleSave(data as BuilderResult<ConfigType>)}
          />
        )
      case 'seqstates':
        return (
          <SequentialStatesBuilderController
            config={config as SequentialStatesCardConfig}
            onDataSubmit={(data: BuilderResult<SequentialStatesCardConfig>) => handleSave(data as BuilderResult<ConfigType>)}
          />
        )
      default:
        toast.error('Unknown visualization type')
        return null
    }
  }

  const trigger = (
    <DialogTrigger asChild>
      <button>
        <Pencil className="h-4 w-4 text-secondary" />
      </button>
    </DialogTrigger>
  )

  const modalContent = (
    <>
      {isDesktop ? (
        <DialogHeader>
          <DialogTitle>Card editor</DialogTitle>
          <DialogDescription>Make changes to the card configuration</DialogDescription>
        </DialogHeader>
      ) : (
        <DrawerHeader>
          <DrawerTitle>Card editor</DrawerTitle>
          <DrawerDescription>Make changes to the card configuration</DrawerDescription>
        </DrawerHeader>
      )}
      {renderBuilder()}
      {!isDesktop && (
        <DrawerFooter className="pt-4">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      )}
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
          <div className="h-fit max-h-[calc(95vh-2rem)] sm:p-4">{modalContent}</div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}
