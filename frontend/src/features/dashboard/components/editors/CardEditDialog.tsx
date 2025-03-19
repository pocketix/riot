import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CiEdit } from 'react-icons/ci'
import { useState } from 'react'
import { ChartCardConfig } from '@/schemas/dashboard/LineChartBuilderSchema'
import { LineChartBuilder } from '../builders/LineChartBuilder'
import { EntityCardConfig } from '@/schemas/dashboard/EntityCardBuilderSchema'
import { EntityCardBuilder } from '../builders/EntityCardBuilder'
import { TableCardConfig } from '@/schemas/dashboard/TableBuilderSchema'
import { TableCardBuilder } from '../builders/TableCardBuilder'
import { BulletCardConfig } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { BulletChartBuilder } from '../builders/BulletChartBuilder'
import { useQuery } from '@apollo/client'
import { SdInstance } from '@/generated/graphql'
import { GET_INSTANCES } from '@/graphql/Queries'
import { toast } from 'sonner'
import { DialogDescription } from '@radix-ui/react-dialog'
import { BuilderResult } from '../VisualizationBuilder'

export interface CardEditDialogProps<ConfigType> {
  config?: ConfigType
  visualizationType: 'line' | 'switch' | 'table' | 'bullet' | 'entitycard'
  onSave: (result: BuilderResult<ConfigType>) => void
}

export function CardEditDialog<ConfigType extends EntityCardConfig | ChartCardConfig | TableCardConfig | BulletCardConfig>({ config, onSave, visualizationType }: CardEditDialogProps<ConfigType>) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data } = useQuery<{ sdInstances: SdInstance[] }>(GET_INSTANCES)

  const handleSave = (result: BuilderResult<ConfigType>) => {
    onSave(result)
    setDialogOpen(false)
  }

  const renderBuilder = () => {
    switch (visualizationType) {
      case 'line':
        return (
          <LineChartBuilder
            config={config as ChartCardConfig}
            onDataSubmit={(data: BuilderResult<ChartCardConfig>) => handleSave(data as BuilderResult<ConfigType>)}
            instances={data?.sdInstances || []}
          />
        )
      case 'switch':
        // TODO: Add Switch builder
        return <div>Switch</div>
      case 'table':
        return (
          <TableCardBuilder
            config={config as TableCardConfig}
            onDataSubmit={(data: BuilderResult<TableCardConfig>) => handleSave(data as BuilderResult<ConfigType>)}
            instances={data?.sdInstances || []}
          />
        )
      case 'bullet':
        return (
          <BulletChartBuilder
            config={config as BulletCardConfig}
            onDataSubmit={(data: BuilderResult<BulletCardConfig>) => handleSave(data as BuilderResult<ConfigType>)}
            instances={data?.sdInstances || []}
          />
        )
      case 'entitycard':
        return (
          <EntityCardBuilder
            config={config as EntityCardConfig}
            onDataSubmit={(data: BuilderResult<EntityCardConfig>) => handleSave(data as BuilderResult<ConfigType>)}
            instances={data?.sdInstances || []}
          />
        )
      default:
        toast.error('Unknown visualization type')
        return null
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(!dialogOpen)}>
      <DialogTrigger>
        <CiEdit className="text-secondary" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Card editor</DialogTitle>
          <DialogDescription>Make changes to the card configuration</DialogDescription>
        </DialogHeader>
        {renderBuilder()}
      </DialogContent>
    </Dialog>
  )
}
