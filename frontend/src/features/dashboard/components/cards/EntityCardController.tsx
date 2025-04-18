import { useEffect, useState, useRef } from 'react'
import { entityCardSchema, EntityCardConfig } from '@/schemas/dashboard/visualizations/EntityCardBuilderSchema'
import { toast } from 'sonner'
import { StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { Serie } from '@nivo/line'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { EntityCardView } from './EntityCardView'

type EntityCardProps = BaseVisualizationCardProps<EntityCardConfig>
type RowPollingInfo = {
  rowIndex: number
  intervalId: NodeJS.Timeout | null
  lastUpdatedAt?: Date
}

export const EntityCardController = (props: EntityCardProps) => {
  const FETCHES_PER_TIMEFRAME = 4
  const [sparklineData, setSparklineData] = useState<Serie[]>([])
  const [chartConfig, setChartConfig] = useState<EntityCardConfig>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Track polling intervals for each row as they can have different timeframes
  // same principle as in bullet card controller, we must use timouts, as the polling intervals can be different for each row
  // and we cannot use the native apollo pollInterval property
  const rowPollingMap = useRef<Map<number, RowPollingInfo>>(new Map())

  const [fetchSparklineData] = useStatisticsQuerySensorsWithFieldsLazyQuery()

  useEffect(() => {
    if (props.configuration) {
      setIsLoading(true)
      const parsedConfig = entityCardSchema.safeParse(props.configuration.visualizationConfig)
      if (parsedConfig.success) {
        setChartConfig(parsedConfig.data)
      } else {
        setError('Failed to parse configuration')
        console.error('Failed to parse configuration', parsedConfig.error)
        toast.error('Failed to parse configuration')
        setIsLoading(false)
      }
    }
  }, [props.configuration])

  const fetchRowSparklineData = async (rowConfig: EntityCardConfig['rows'][number], rowIndex: number) => {
    if (!chartConfig || !props.isVisible || rowConfig.visualization !== 'sparkline') return

    try {
      const pollingInfo = rowPollingMap.current.get(rowIndex)
      if (pollingInfo) {
        pollingInfo.lastUpdatedAt = new Date()
      }

      const result = await fetchSparklineData({
        variables: {
          sensors: {
            sensors: [
              {
                key: rowConfig.instance.uid,
                values: [rowConfig.parameter.denotation]
              }
            ]
          },
          request: {
            from: new Date(Date.now() - Number(rowConfig.timeFrame) * 60 * 60 * 1000).toISOString(),
            aggregateMinutes: Math.ceil((Number(rowConfig.timeFrame) * 60) / 32),
            operation: StatisticsOperation.Last
          }
        }
      })

      if (!result.data?.statisticsQuerySensorsWithFields) return

      const rawData = result.data.statisticsQuerySensorsWithFields

      if (rawData && rawData.length > 0) {
        const sparklineData = rawData.map((item) => {
          const value = JSON.parse(item.data)
          return {
            x: item.time,
            y: value[rowConfig.parameter.denotation]
          }
        })

        const newSparklineData = [...sparklineData]
        setSparklineData((prevData) => {
          const newData = [...prevData]
          newData[rowIndex] = {
            id: rowConfig.name,
            data: newSparklineData
          }
          return newData
        })
      }

      setIsLoading(false)
    } catch (error) {
      console.error(`Fetch error for row ${rowIndex}:`, error)
    }
  }

  const fetchAllSparklineData = async () => {
    if (!chartConfig?.rows || !props.isVisible) return
    setIsLoading(true)

    const sparklineRows = chartConfig.rows.filter((row) => row.visualization === 'sparkline')

    if (sparklineRows.length === 0) {
      setIsLoading(false)
      return
    }

    try {
      chartConfig.rows.forEach(async (row, rowIndex) => {
        if (row.visualization !== 'sparkline') return
        await fetchRowSparklineData(row, rowIndex)
      })

      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching sparkline data:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!chartConfig?.rows || !props.isVisible) return

    rowPollingMap.current.forEach((info) => {
      if (info.intervalId) clearInterval(info.intervalId)
    })
    rowPollingMap.current.clear()

    chartConfig.rows.forEach((row, index) => {
      if (row.visualization !== 'sparkline') return
      const timeFrameInMs = Number(row.timeFrame) * 60 * 60 * 1000

      const pollInterval = timeFrameInMs / FETCHES_PER_TIMEFRAME

      const scheduleFetch = () => {
        fetchRowSparklineData(row, index)
          .then(() => {
            const newIntervalId = setTimeout(scheduleFetch, pollInterval)
            rowPollingMap.current.set(index, {
              rowIndex: index,
              intervalId: newIntervalId
            })
          })
          .catch((error) => {
            console.error(`Error fetching data for row ${index}:`, error)
          })
      }

      setTimeout(scheduleFetch, pollInterval)
    })

    fetchAllSparklineData()

    // clear all scheduled fetches
    return () => {
      rowPollingMap.current.forEach((info) => {
        if (info.intervalId) clearInterval(info.intervalId)
      })
    }
  }, [chartConfig, props.isVisible])

  return (
    <EntityCardView
      {...props}
      chartConfig={chartConfig}
      sparklineData={sparklineData}
      error={error}
      isLoading={isLoading}
    />
  )
}
