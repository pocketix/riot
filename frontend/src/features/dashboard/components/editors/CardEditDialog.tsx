import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CiEdit } from 'react-icons/ci'
import { useState } from 'react'
import { ChartCardConfig } from '@/schemas/dashboard/LineChartBuilderSchema'
import { EntityCardConfig } from '@/schemas/dashboard/EntityCardBuilderSchema'
import { TableCardConfig } from '@/schemas/dashboard/TableBuilderSchema'
import { BulletCardConfig } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { EntityCardBuilder } from '../builders/EntityCardBuilder'
import { LineChartBuilder } from '../builders/LineChartBuilder'
import { TableCardBuilder } from '../builders/TableCardBuilder'
import { BulletChartBuilder } from '../builders/BulletChartBuilder'
import { useQuery } from '@apollo/client'
import { SdInstance } from '@/generated/graphql'
import { GET_INSTANCES } from '@/graphql/Queries'
import { toast } from 'sonner'
import { DialogDescription } from '@radix-ui/react-dialog'

export interface CardEditDialogProps {
  entityCardConfig?: EntityCardConfig
  chartCardConfig?: ChartCardConfig
  tableCardConfig?: TableCardConfig
  bulletCardConfig?: BulletCardConfig
}

const saveConfig = (config: any) => {
  console.log('Saving config', config)
}

export function CardEditDialog({ entityCardConfig, chartCardConfig, tableCardConfig, bulletCardConfig }: CardEditDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data } = useQuery<{ sdInstances: SdInstance[] }>(GET_INSTANCES)

  const renderBuilder = () => {
    if (entityCardConfig) {
      return <EntityCardBuilder config={entityCardConfig} onDataSubmit={saveConfig} instances={data?.sdInstances || []} />
    } else if (chartCardConfig) {
      return <LineChartBuilder config={chartCardConfig} onDataSubmit={saveConfig} instances={data?.sdInstances || []} />
    } else if (tableCardConfig) {
      return <TableCardBuilder config={tableCardConfig} onDataSubmit={saveConfig} instances={data?.sdInstances || []} />
    } else if (bulletCardConfig) {
      return <BulletChartBuilder config={bulletCardConfig} onDataSubmit={saveConfig} instances={data?.sdInstances || []} />
    } else {
      toast.error('No configuration found')
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
