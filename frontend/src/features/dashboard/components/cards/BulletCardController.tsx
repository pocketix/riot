import { useEffect, useState, useRef } from 'react'
import { bulletChartBuilderSchema, BulletCardConfig } from '@/schemas/dashboard/visualizations/BulletChartBuilderSchema'
import { StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { BulletCardView } from './BulletCardView'
import { Datum } from '@nivo/bullet'

type BulletCardProps = BaseVisualizationCardProps<BulletCardConfig>
export type BulletRowData = {
  data: Datum | null
  updatedAt?: Date
}

type RowPollingInfo = {
  rowIndex: number
  intervalId: NodeJS.Timeout | null
  lastUpdatedAt?: Date
}

export const BulletCardController = (props: BulletCardProps) => {
  const FETCHES_PER_TIMEFRAME = 4
  const [chartConfig, setChartConfig] = useState<BulletCardConfig>()
  const [data, setData] = useState<BulletRowData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Track polling intervals for each row as they can have different timeframes
  const rowPollingMap = useRef<Map<number, RowPollingInfo>>(new Map())

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

  function setRowData(rowIndex: number, rowData: BulletRowData) {
    setData(prevData => {
      const newData = [...prevData]
      newData[rowIndex] = rowData
      return newData
    })
  }

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

      if (!result.data?.statisticsQuerySensorsWithFields) {
        setRowData(rowIndex, {
          updatedAt: new Date(),
          data: null
        })
        setIsLoading(false)
        return
      }

      const sensorData = result.data.statisticsQuerySensorsWithFields[0]
      if (!sensorData?.data) {
        setRowData(rowIndex, {
          updatedAt: new Date(),
          data: null
        })
        setIsLoading(false)
        return
      }

      try {
        const parsedValue = JSON.parse(sensorData.data)
        const value = parsedValue[row.parameter.denotation]

        if (value === undefined) {
          setRowData(rowIndex, {
            updatedAt: new Date(),
            data: null
          })
          setIsLoading(false)
          return
        }

        setRowData(rowIndex, {
          updatedAt: new Date(),
          data: {
            id: row.config.name,
            measures: [value],
            markers: row.config.markers,
            ranges: row.config.ranges ? row.config.ranges.flatMap((range) => [range.min, range.max]) : [0, 0]
          }
        })
        setIsLoading(false)
      } catch (err) {
        console.error(`Error parsing data for bullet row`, err)
        setRowData(rowIndex, {
          updatedAt: new Date(),
          data: null
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error(`Fetch error for bullet row`, error)
      setRowData(rowIndex, {
        updatedAt: new Date(),
        data: null
      })
      setIsLoading(false)
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
      const timeFrameInMs = Number(row.config.timeFrame) * 60 * 60 * 1000

      const pollInterval = timeFrameInMs / FETCHES_PER_TIMEFRAME

      const scheduleFetch = () => {
        fetchRowData(row, rowIndex)
          .then(() => {
            const newIntervalId = setTimeout(scheduleFetch, pollInterval)
            rowPollingMap.current.set(rowIndex, {
              rowIndex: rowIndex,
              intervalId: newIntervalId,
              lastUpdatedAt: new Date()
            })
          })
          .catch((error) => {
            console.error(`Error fetching data for row ${rowIndex}:`, error)
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
