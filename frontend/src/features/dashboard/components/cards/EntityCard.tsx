import { useEffect, useMemo, useState } from 'react'
import { entityCardSchema, EntityCardConfig } from '@/schemas/dashboard/EntityCardBuilderSchema'
import { toast } from 'sonner'
import { StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { BaseCard } from './BaseCard'
import { ResponsiveEntityTable } from '../visualizations/ResponsiveEntityTable'
import { Serie } from '@nivo/line'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'

type EntityCardProps = BaseVisualizationCardProps<EntityCardConfig>

export const EntityCard = (props: EntityCardProps) => {
  const [sparklineData, setSparklineData] = useState<Record<string, Serie[]>>({})
  const [chartConfig, setChartConfig] = useState<EntityCardConfig>()
  const [error, setError] = useState<string | null>(null)

  const minimumTimeframe = useMemo(() => {
    const rows = chartConfig?.rows
    if (!rows) return 0

    const timeframes = rows.map((row) => Number(row.timeFrame))
    const minTimeframe = Math.min(...timeframes)

    return minTimeframe
  }, [chartConfig])

  const [fetchData] = useStatisticsQuerySensorsWithFieldsLazyQuery({
    pollInterval: minimumTimeframe ? (minimumTimeframe / 4) * 60 * 1000 : 0
    // TODO: doesnt work probably
  })

  const fetchSparklineData = async () => {
    if (!chartConfig?.rows) return

    // Get rows with sparklines
    const sparklineRows = chartConfig.rows.filter((row) => row.visualization === 'sparkline')

    if (sparklineRows.length === 0) return

    const sparklineRequests = sparklineRows.map((row) => ({
      id: `${row.instance.id}-${row.parameter.id}`,
      key: row.instance.uid,
      values: row.parameter.denotation,
      timeFrame: Number(row.timeFrame),
      aggregatedMinutes: (Number(row.timeFrame) * 60) / 32
    }))

    const results = await Promise.allSettled(
      sparklineRequests.map((req) => {
        return fetchData({
          variables: {
            sensors: {
              sensors: [{ key: req.key, values: [req.values] }]
            },
            request: {
              from: new Date(Date.now() - req.timeFrame * 60 * 60 * 1000).toISOString(),
              aggregateMinutes: Math.ceil(req.aggregatedMinutes),
              operation: StatisticsOperation.Last
            }
          }
        })
      })
    )

    const newSparklineData: Record<string, Serie[]> = {}

    results.forEach((result, index) => {
      const rowId = sparklineRequests[index].id

      if (result.status === 'fulfilled' && result.value.data?.statisticsQuerySensorsWithFields.length! > 0) {
        const rawData = result.value.data?.statisticsQuerySensorsWithFields
        const sparklinePoints = rawData?.map((item: any) => {
          const value = JSON.parse(item.data)
          return {
            x: item.time,
            y: value[sparklineRequests[index].values]
          }
        })

        newSparklineData[rowId] = [{ id: rowId, data: sparklinePoints! }]
      }
    })

    setSparklineData(newSparklineData)
  }

  useEffect(() => {
    if (props.configuration) {
      const parsedConfig = entityCardSchema.safeParse(props.configuration.visualizationConfig)
      if (parsedConfig.success) {
        setChartConfig(parsedConfig.data)
      } else {
        setError('Failed to parse configuration')
        console.error('Failed to parse configuration', parsedConfig.error)
        toast.error('Failed to parse configuration')
      }
    }
  }, [props.configuration])

  useEffect(() => {
    if (chartConfig && props.isVisible) {
      fetchSparklineData()
    }
  }, [chartConfig, props.isVisible])

  const isLoading = !chartConfig || !chartConfig.rows

  return (
    <BaseCard<EntityCardConfig>
      {...props}
      isLoading={isLoading}
      error={error}
      visualizationType="entitycard"
      cardTitle={chartConfig?.title}
      configuration={chartConfig!}
    >
      <ResponsiveEntityTable
        config={chartConfig!}
        sparklineData={sparklineData}
        height={props.height}
        className="px-2 pt-0"
      />
    </BaseCard>
  )
}
