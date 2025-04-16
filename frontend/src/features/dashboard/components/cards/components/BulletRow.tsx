import { useInstances } from '@/context/InstancesContext'
import { useParameterSnapshot } from '@/hooks/useParameterSnapshot'
import { BulletCardConfig } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ResponsiveBulletChart } from '../../visualizations/ResponsiveBulletChart'
import { Datum } from '@nivo/bullet'
import { ChartContainer } from '../BaseCard'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'

interface BulletRowProps {
  row: BulletCardConfig['rows'][number]
  editModeEnabled: boolean
  aggregatedData?: Datum
  aggregateUpdatedAt?: Date
}

export const BulletRow = ({ row, editModeEnabled, aggregatedData = undefined, aggregateUpdatedAt = undefined }: BulletRowProps) => {
  let { value, lastUpdated } = useParameterSnapshot(row.instance.id!, row.parameter.id!)
  const { getInstanceById } = useInstances()

  lastUpdated = aggregatedData !== undefined ? aggregateUpdatedAt! : lastUpdated

  const chartData: Datum = useMemo(() => {
    if (aggregatedData) {
      return aggregatedData
    }

    const ranges = row.config.ranges
      ? [...row.config.ranges.flatMap((range) => [range.min, range.max])]
      : [0, 0, -1, -1]

    return {
      id: row.config.name,
      measures: [Number(value) || 0],
      markers: row.config.markers,
      ranges: ranges
    }
  }, [value, row, aggregatedData])

  const instanceName = getInstanceById(row.instance.id!)?.userIdentifier

  if (!chartData) {
    return (
      <ChartContainer $editModeEnabled={editModeEnabled}>
        <Skeleton className="h-full w-full p-2" disableAnimation>
          <ResponsiveTooltip
            content={
              <div className="flex max-w-28 flex-col">
                <span className="font-semibold text-destructive">No data available</span>
                <span className="break-words text-xs">Device: {instanceName}</span>
                <span className="text-xs">Parameter: {row.config.name}</span>
              </div>
            }
          >
            <div className="flex w-full flex-col items-center justify-center">
              <span className="w-full truncate text-center font-bold text-destructive">Data not available</span>
              <span className="w-full truncate text-center text-xs text-gray-500">Device: {instanceName}</span>
              <span className="w-full truncate text-center text-xs text-gray-500">Parameter: {row.config.name}</span>
            </div>
          </ResponsiveTooltip>
        </Skeleton>
      </ChartContainer>
    )
  }

  return (
    <ChartContainer $editModeEnabled={editModeEnabled}>
      <ResponsiveBulletChart data={chartData} rowConfig={row} lastUpdated={lastUpdated || undefined} />
    </ChartContainer>
  )
}
