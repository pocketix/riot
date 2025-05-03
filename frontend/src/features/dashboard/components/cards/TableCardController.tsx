import { useEffect, useState, useRef } from 'react'
import { TableCardConfig, tableCardSchema } from '@/schemas/dashboard/visualizations/TableBuilderSchema'
import { SensorField, StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { TableCardView } from './TableCardView'

type TableCardProps = BaseVisualizationCardProps<TableCardConfig>
type ColumnFetchInfo = {
  intervalId: NodeJS.Timeout | null
  lastUpdatedAt?: Date
}

export type TableColumnData = {
  function: string
  values: (number | null)[]
}

export const TableCardController = (props: TableCardProps) => {
  const FETCHES_PER_TIMEFRAME = 4
  const { setDetailsSelectedDevice } = useDeviceDetail()
  const [tableConfig, setTableConfig] = useState<TableCardConfig>()
  const [columnData, setColumnData] = useState<TableColumnData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isMounted = useRef(true)
  const columnPollingMap = useRef<Map<number, ColumnFetchInfo>>(new Map())
  const [fetchTableData] = useStatisticsQuerySensorsWithFieldsLazyQuery()

  useEffect(() => {
    if (props.configuration) {
      setIsLoading(true)
      const parsedConfig = tableCardSchema.safeParse(props.configuration.visualizationConfig)
      if (parsedConfig.success) {
        setTableConfig(parsedConfig.data)
      } else {
        setError('Failed to parse configuration')
        setIsLoading(false)
      }
    }
  }, [props.configuration])

  function combineSensors(sensors: SensorField[]): SensorField[] {
    const combinedSensors: { [key: string]: string[] } = {}
    sensors.forEach((sensor) => {
      if (!combinedSensors[sensor.key]) {
        combinedSensors[sensor.key] = []
      }
      combinedSensors[sensor.key] = [...combinedSensors[sensor.key], ...sensor.values]
    })
    return Object.keys(combinedSensors).map((key) => ({
      key,
      values: combinedSensors[key]
    }))
  }

  const fetchSingleColumnData = async (column: TableCardConfig['columns'][number], columnIndex: number) => {
    if (!tableConfig || !props.isVisible || !isMounted.current) return

    const sensors: SensorField[] = tableConfig.rows.map((row) => ({
      key: row.instance.uid,
      values: [row.parameter.denotation]
    }))
    const combinedSensors = combineSensors(sensors)
    if (!combinedSensors.length) return

    try {
      const pollingInfo = columnPollingMap.current.get(columnIndex)
      if (pollingInfo) pollingInfo.lastUpdatedAt = new Date()
      if (column.function === 'last') return

      const result = await fetchTableData({
        variables: {
          sensors: { sensors: combinedSensors },
          request: {
            from: new Date(Date.now() - Number(tableConfig.timeFrame) * 60 * 60 * 1000).toISOString(),
            aggregateMinutes: Number(tableConfig.timeFrame) * 60 * 1000,
            operation: column.function as StatisticsOperation
          }
        }
      })

      if (!result.data?.statisticsQuerySensorsWithFields || !isMounted.current) return

      // Map deviceId to parsed data, to then insert them correctly in the column
      const deviceDataMap: Record<string, any> = {}
      result.data.statisticsQuerySensorsWithFields.forEach((item) => {
        try {
          deviceDataMap[item.deviceId] = JSON.parse(item.data)
        } catch (err) {
          console.error(`Error parsing data for ${item.deviceId}:`, err)
        }
      })

      // Build values array for this column
      const values = tableConfig.rows.map((row) => {
        const deviceParsed = deviceDataMap[row.instance.uid]
        return deviceParsed ? deviceParsed[row.parameter.denotation] : null
      })

      setColumnData((prev) => {
        const updated = [...prev]
        updated[columnIndex] = { function: column.function, values }
        return updated
      })

      setIsLoading(false)
    } catch (error) {
      console.error(`Fetch error for ${column.function}:`, error)
    }
  }

  const fetchAllData = async () => {
    if (!tableConfig || !props.isVisible) return
    setIsLoading(true)
    const aggregatedColumns = tableConfig.columns.filter((column) => column.function !== 'last')
    if (aggregatedColumns.length === 0) {
      setColumnData(
        tableConfig.columns.map((col) => ({
          function: col.function,
          values: tableConfig.rows.map(() => null)
        }))
      )
      setIsLoading(false)
      return
    }

    try {
      await Promise.all(
        tableConfig.columns.map(async (column, columnIndex) => {
          if (column.function === 'last') return
          await fetchSingleColumnData(column, columnIndex)
        })
      )
      setIsLoading(false)
    } catch (error) {
      console.error('Fetch error:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!tableConfig || !props.isVisible) return

    columnPollingMap.current.forEach((info) => {
      if (info.intervalId) clearInterval(info.intervalId)
    })
    columnPollingMap.current.clear()

    tableConfig.columns.forEach((column, columnIndex) => {
      if (column.function === 'last') return

      const timeFrameMs = Number(tableConfig.timeFrame) * 60 * 1000
      const pollInterval = timeFrameMs / FETCHES_PER_TIMEFRAME

      const intervalId = setInterval(() => {
        if (props.isVisible && isMounted.current) {
          fetchSingleColumnData(column, columnIndex)
        }
      }, pollInterval)

      columnPollingMap.current.set(columnIndex, {
        intervalId,
        lastUpdatedAt: new Date()
      })
    })

    fetchAllData()

    return () => {
      columnPollingMap.current.forEach((info) => {
        if (info.intervalId) clearInterval(info.intervalId)
      })
    }
  }, [tableConfig, props.isVisible])

  const handleRowClick = (instanceId: number, parameterId: number) => {
    setDetailsSelectedDevice(instanceId, parameterId)
  }

  return (
    <TableCardView
      {...props}
      tableConfig={tableConfig}
      columnData={columnData}
      error={error}
      isLoading={isLoading}
      onRowClick={handleRowClick}
    />
  )
}
