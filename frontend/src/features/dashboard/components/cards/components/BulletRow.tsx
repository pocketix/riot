import { useInstances } from '@/context/InstancesContext'
import { useParameterSnapshot } from '@/hooks/useParameterSnapshot'
import { BulletCardConfig } from '@/schemas/dashboard/visualizations/BulletChartBuilderSchema'
import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ResponsiveBulletChart } from '../../visualizations/ResponsiveBulletChart'
import { Datum } from '@nivo/bullet'
import { ChartContainer } from '../BaseCard'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'

interface BulletRowProps {
  row: BulletCardConfig['rows'][number]
  editModeEnabled: boolean
  aggregatedData?: Datum | null
  aggregateUpdatedAt?: Date
}

export const BulletRow = ({
  row,
  editModeEnabled,
  aggregatedData = undefined,
  aggregateUpdatedAt = undefined
}: BulletRowProps) => {
  let { value, lastUpdated } = useParameterSnapshot(row.instance.id!, row.parameter.id!)
  const { getInstanceById } = useInstances()

  lastUpdated = aggregatedData !== null ? aggregateUpdatedAt! : lastUpdated

  // Either the aggregated data or the parameter snapshot value
  // if the chartData is null, an error is displayed
  const chartData: Datum | null = useMemo(() => {
    if (aggregatedData !== undefined) {
      return aggregatedData
    }

    const ranges = row.config.ranges
      ? [...row.config.ranges.flatMap((range) => [range.min, range.max])]
      : [0, 0, -1, -1]

    // Parameter snapshot returned null
    if (value === null) return null

    return {
      id: row.config.name,
      measures: [Number(value)],
      markers: row.config.markers,
      ranges: ranges
    }
  }, [value, row, aggregatedData])

  const instanceName = getInstanceById(row.instance.id!)?.userIdentifier

  if (!chartData) {
    return (
      <ChartContainer $editModeEnabled={editModeEnabled}>
        <Skeleton className="h-full w-full p-0" disableAnimation>
          <ResponsiveTooltip
            content={
              <div className="flex flex-col items-center justify-center">
                <span className="font-semibold text-destructive">No data available</span>
                <span className="break-words text-xs">Device: {instanceName}</span>
                <span className="text-xs">Parameter: {row.config.name}</span>
              </div>
            }
            className="h-full w-full"
          >
            <div className="flex h-full w-full flex-col items-center justify-center">
              <span className="flex h-full w-full items-center justify-center text-center font-bold text-destructive">
                Data unavailable
              </span>
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
