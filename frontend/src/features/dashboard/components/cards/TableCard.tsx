import { useEffect, useState, useMemo } from 'react'
import { TableCardConfig, tableCardSchema } from '@/schemas/dashboard/TableBuilderSchema'
import { toast } from 'sonner'
import { SensorField, StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { ResponsiveTable, TableRowData } from '../visualizations/ResponsiveTable'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { BaseCard } from './BaseCard'
import { BuilderResult } from '@/types/dashboard/GridItem'
import { Layout } from 'react-grid-layout'

interface TableCardProps {
  cardID: string
  layout: Layout[]
  setLayout: (layout: Layout[]) => void
  breakPoint: string
  editModeEnabled: boolean
  cols: { lg: number; md: number; sm: number; xs: number; xxs: number }
  handleDeleteItem: (id: string) => void
  height: number
  width: number
  setHighlightedCardID: (id: string) => void
  beingResized: boolean
  handleSaveEdit: (config: BuilderResult<TableCardConfig>) => void
  configuration: any
}

export const TableCard = (props: TableCardProps) => {
  const { setDetailsSelectedDevice } = useDeviceDetail()

  const [tableConfig, setTableConfig] = useState<TableCardConfig>()
  const [tableData, setTableData] = useState<TableRowData[]>([])
  const [error, setError] = useState<string | null>(null)

  const refetchTime = useMemo(() => {
    return tableConfig?.timeFrame
  }, [tableConfig])

  const [fetchTableData] = useStatisticsQuerySensorsWithFieldsLazyQuery({
    pollInterval: refetchTime ? Number(refetchTime) * 60 * 1000 : 0
  })

  const fetchData = async (sensors: SensorField[], from: string, aggregateMinutes: number, operation: string) => {
    return fetchTableData({
      variables: {
        sensors: { sensors },
        request: {
          from: from,
          aggregateMinutes: aggregateMinutes,
          operation: operation as StatisticsOperation
        }
      }
    })
  }

  useEffect(() => {
    if (props.configuration) {
      const parsedConfig = tableCardSchema.safeParse(props.configuration.visualizationConfig)
      if (parsedConfig.success) {
        setTableConfig(parsedConfig.data)
      } else {
        setError('Failed to parse configuration')
        console.error('Failed to parse configuration:', parsedConfig.error)
        toast.error('Failed to parse configuration')
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

  useEffect(() => {
    const fetchAggregatedData = async () => {
      if (!tableConfig) return

      const sensors: SensorField[] = tableConfig.rows.map((row) => ({
        key: row.instance.uid,
        values: [row.parameter.denotation]
      }))

      const combinedSensors = combineSensors(sensors)
      if (!combinedSensors.length) return

      // filter out only the columns that need aggregation
      const aggregatedColumns = tableConfig.columns.filter((column) => column.function !== 'last')

      if (aggregatedColumns.length === 0) {
        const rows = tableConfig.rows.map((row) => ({
          ...row,
          values: tableConfig.columns.map((column) => ({
            function: column.function,
            value: undefined // will get filled by parameter snapshot if possibel
          }))
        }))
        setTableData(rows)
        return
      }

      try {
        const results = await Promise.allSettled(
          aggregatedColumns.map((column) =>
            fetchData(
              combinedSensors,
              new Date(Date.now() - Number(tableConfig.timeFrame) * 60 * 60 * 1000).toISOString(),
              Number(tableConfig.timeFrame) * 60 * 1000,
              column.function
            )
          )
        )

        const parsedData = results.map((result) => {
          if (result.status === 'fulfilled' && result.value.data?.statisticsQuerySensorsWithFields.length! > 0) {
            return result.value.data?.statisticsQuerySensorsWithFields
          } else {
            console.error('Fetch error:', result.status === 'rejected' ? result.reason : 'Empty data')
            return null
          }
        })

        const columnMap = new Map<string, number>()
        tableConfig.columns.forEach((column, index) => {
          columnMap.set(column.function, index)
        })

        const updatedRows = tableConfig.rows.map((row) => {
          const values = tableConfig.columns.map((column) => ({
            function: column.function,
            value: undefined
          }))

          // Fill the aggregated data
          aggregatedColumns.forEach((column, idx) => {
            const columnIndex = columnMap.get(column.function)!
            const columnData = parsedData[idx]

            if (columnData) {
              const instanceData = columnData.find((data: any) => data.deviceId === row.instance.uid)
              if (instanceData) {
                let parsedValue = JSON.parse(instanceData.data)
                values[columnIndex] = {
                  function: column.function,
                  value: parsedValue[row.parameter.denotation]
                }
              }
            }
          })

          return { ...row, values }
        })

        setTableData(updatedRows)
      } catch (error) {
        console.error('Fetch error:', error)
      }
    }

    fetchAggregatedData()
  }, [tableConfig, fetchTableData])

  const handleRowClick = (instanceId: number, parameterId: number) => {
    setDetailsSelectedDevice(instanceId, parameterId)
  }

  const isLoading = !tableConfig || !tableConfig.columns || !tableData

  return (
    <BaseCard<TableCardConfig>
      {...props}
      isLoading={isLoading}
      error={error}
      visualizationType="table"
      cardTitle={tableConfig?.title}
      configuration={tableConfig!}
    >
      <ResponsiveTable
        data={tableData}
        config={tableConfig!}
        onRowClick={handleRowClick}
        height={props.height}
        className="px-2"
      />
    </BaseCard>
  )
}
