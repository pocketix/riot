import { useEffect, useState, useRef } from 'react'
import { bulletChartBuilderSchema, BulletCardConfig } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { BulletCardView } from './BulletCardView'
import { Datum } from '@nivo/bullet'

type BulletCardProps = BaseVisualizationCardProps<BulletCardConfig>
export type BulletRowData = {
  rowIndex: number
  data: Datum
  updatedAt?: Date
}

type RowPollingInfo = {
  rowId: string
  intervalId: NodeJS.Timeout | null
  timeFrame: number
}

export const BulletCardController = (props: BulletCardProps) => {
  const FETCHES_PER_TIMEFRAME = 4
  const [chartConfig, setChartConfig] = useState<BulletCardConfig>()
  const [data, setData] = useState<BulletRowData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Track polling intervals for each row as they can have different timeframes
  const rowPollingMap = useRef<Map<string, RowPollingInfo>>(new Map())

  const [getChartData] = useStatisticsQuerySensorsWithFieldsLazyQuery()

  // Parse configuration
  useEffect(() => {
    if (props.configuration) {
      setIsLoading(true)
      const parsedConfig = bulletChartBuilderSchema.safeParse(props.configuration.visualizationConfig)
      if (parsedConfig.success) {
        setChartConfig(parsedConfig.data)
      } else {
        setError('Failed to parse configuration')
        console.error('Failed to parse configuration', parsedConfig.error)
        setIsLoading(false)
      }
    }
  }, [props.configuration])

  const fetchRowData = async (row: BulletCardConfig['rows'][number], rowIndex: number) => {
    if (!chartConfig || !props.isVisible || row.config.function === 'last') return

    try {
      const result = await getChartData({
        variables: {
          sensors: {
            sensors: [
              {
                key: row.instance.uid,
                values: [row.parameter.denotation]
              }
            ]
          },
          request: {
            from: new Date(Date.now() - Number(row.config.timeFrame) * 60 * 60 * 1000).toISOString(),
            aggregateMinutes: Number(row.config.timeFrame) * 60 * 1000,
            operation: row.config.function as StatisticsOperation
          }
        }
      })

      if (!result.data?.statisticsQuerySensorsWithFields) return

      const sensorData = result.data.statisticsQuerySensorsWithFields[0]
      if (!sensorData?.data) return

      try {
        const parsedValue = JSON.parse(sensorData.data)
        const value = parsedValue[row.parameter.denotation]

        if (value === undefined) return

        setData((prevData) => {
          const newData = [...prevData]

          const existingIndex = newData.findIndex((item) => item.rowIndex === rowIndex)
          const newRowData = {
            rowIndex,
            updatedAt: new Date(),
            data: {
              id: row.config.name,
              measures: [value],
              markers: row.config.markers,
              ranges: row.config.ranges ? row.config.ranges.flatMap((range) => [range.min, range.max]) : [0, 0]
            }
          }

          if (existingIndex >= 0) {
            newData[existingIndex] = newRowData
          } else {
            newData.push(newRowData)
          }

          return newData
        })

        setIsLoading(false)
      } catch (err) {
        console.error(`Error parsing data for bullet row`, err)
      }
    } catch (error) {
      console.error(`Fetch error for bullet row`, error)
    }
  }

  const fetchAllData = async () => {
    if (!chartConfig?.rows || !props.isVisible) return

    setIsLoading(true)

    try {
      const fetchPromises = chartConfig.rows.map((row, index) => {
        if (row.config.function === 'last') return Promise.resolve()
        return fetchRowData(row, index)
      })

      await Promise.all(fetchPromises)

      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching initial bullet chart data:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!chartConfig?.rows || !props.isVisible) return

    rowPollingMap.current.forEach((info) => {
      if (info.intervalId) clearTimeout(info.intervalId)
    })
    rowPollingMap.current.clear()

    chartConfig.rows.forEach((row, rowIndex) => {
      if (row.config.function === 'last') return
      const rowId = `${row.instance.id}-${row.parameter.id}-${row.config.function}-${row.config.timeFrame}`
      const timeFrameInMs = Number(row.config.timeFrame) * 60 * 60 * 1000

      const pollInterval = timeFrameInMs / FETCHES_PER_TIMEFRAME

      const scheduleFetch = () => {
        fetchRowData(row, rowIndex)
          .then(() => {
            const newIntervalId = setTimeout(scheduleFetch, pollInterval)
            rowPollingMap.current.set(rowId, {
              rowId,
              intervalId: newIntervalId,
              timeFrame: Number(row.config.timeFrame)
            })
          })
          .catch((error) => {
            console.error(`Error fetching data for row ${rowId}:`, error)
          })
      }

      setTimeout(scheduleFetch, pollInterval)
    })

    fetchAllData()

    // Clear all scheduled fetches on unmounting / dependency change
    return () => {
      rowPollingMap.current.forEach((info) => {
        if (info.intervalId) clearTimeout(info.intervalId)
      })
    }
  }, [chartConfig, props.isVisible])

  return <BulletCardView {...props} data={data} chartConfig={chartConfig} error={error} isLoading={isLoading} />
}
