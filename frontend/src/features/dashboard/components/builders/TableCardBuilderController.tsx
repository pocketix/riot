import { useEffect, useState } from 'react'
import {
  SdParameterType,
  SensorField,
  StatisticsOperation,
  useStatisticsQuerySensorsWithFieldsLazyQuery
} from '@/generated/graphql'
import { BuilderResult } from '@/types/dashboard/gridItem'
import { TableCardConfig } from '@/schemas/dashboard/visualizations/TableBuilderSchema'
import { TableCardBuilderView } from './TableCardBuilderView'
import { Parameter, useInstances } from '@/context/InstancesContext'
import { TableColumnData } from '../cards/TableCardController'

type TableCardBuilderResult = BuilderResult<TableCardConfig>

export interface TableCardBuilderControllerProps {
  onDataSubmit: (data: TableCardBuilderResult) => void
  config?: TableCardConfig
}

export function TableCardBuilderController({ onDataSubmit, config }: TableCardBuilderControllerProps) {
  const [columnData, setColumnData] = useState<TableColumnData[]>([])
  const [fetchTableData] = useStatisticsQuerySensorsWithFieldsLazyQuery()
  const { getInstanceParameters } = useInstances()

  useEffect(() => {
    if (config) {
      fetchFullTableData(config)
    }
  }, [config])

  const fetchSingleRowData = async (config: TableCardConfig, rowIndex: number) => {
    const rowData = config.rows[rowIndex]
    const timeFrame = config.timeFrame
    const columns = config.columns
    if (!rowData || !config || !config.rows.length || !config.columns.length) return
    if (!rowData.instance?.uid || !rowData.parameter?.denotation) return

    // Get columns that need to be fetched
    const aggregatedColumns = columns.filter((column) => column.function !== 'last' && column.function !== '')

    if (aggregatedColumns.length === 0) {
      return
    }

    const sensorField: SensorField = {
      key: rowData.instance.uid,
      values: [rowData.parameter.denotation]
    }

    try {
      // Fetch data for each aggregated column for this row
      const results = await Promise.allSettled(
        aggregatedColumns.map((column) =>
          fetchData(
            [sensorField],
            new Date(Date.now() - Number(timeFrame) * 60 * 60 * 1000).toISOString(),
            Number(timeFrame) * 60 * 1000,
            column.function
          )
        )
      )

      const parsedData = results.map((result) => {
        if (result.status === 'fulfilled' && result.value.data?.statisticsQuerySensorsWithFields.length! > 0) {
          return result.value.data?.statisticsQuerySensorsWithFields
        } else {
          return null
        }
      })

      let aggregateIndex = 0
      columns.forEach((column, index) => {
        if (column.function === 'last') return

        const columnData = parsedData[aggregateIndex]
        aggregateIndex++

        if (columnData && columnData.length > 0) {
          const deviceDataMap: Record<string, any> = {}
          columnData.forEach((item) => {
            try {
              deviceDataMap[item.deviceId] = JSON.parse(item.data)
            } catch (err) {
              console.error(`Error parsing data for ${item.deviceId}:`, err)
            }
          })

          // Build the column data while keeping the previous values
          setColumnData((prev) => {
            const updated = [...prev]
            const prevValues = prev[index]?.values
            const deviceParsed = deviceDataMap[rowData.instance.uid]

            // Insert the new row value at the rowIndex, which is the index of row being changed
            prevValues[rowIndex] = deviceParsed ? deviceParsed[rowData.parameter.denotation] : null

            // Update the whole column with new the value
            updated[index] = { function: column.function, values: prevValues }
            return updated
          })
        } else {
          setColumnData((prev) => {
            const updated = [...prev]
            const prevValues = prev[index]?.values

            // Only set the missing data to undefined
            prevValues[rowIndex] = null
            updated[index] = { function: column.function, values: prevValues }
            return updated
          })
        }
      })
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const fetchSingleColumnData = async (config: TableCardConfig, columnIndex: number) => {
    const column = config.columns[columnIndex]
    if (!column || !config.rows.length) return

    // Reset the whole column
    setColumnData((prev) => {
      const updated = [...prev]
      updated[columnIndex] = { function: column.function, values: config.rows.map(() => null) }
      return updated
    })

    if (column.function === 'last' || column.function === '') return

    config.rows.forEach(async (row, rowIndex) => {
      if (!row?.instance?.uid || !row?.parameter?.denotation) return

      const sensorField: SensorField = {
        key: row.instance.uid,
        values: [row.parameter.denotation]
      }

      try {
        const result = await fetchData(
          [sensorField],
          new Date(Date.now() - Number(config.timeFrame) * 60 * 60 * 1000).toISOString(),
          Number(config.timeFrame) * 60 * 1000,
          column.function
        )

        const columnData = result.data?.statisticsQuerySensorsWithFields
        if (columnData && columnData.length > 0) {
          const deviceDataMap: Record<string, any> = {}
          columnData.forEach((item) => {
            try {
              deviceDataMap[item.deviceId] = JSON.parse(item.data)
            } catch (err) {
              console.error(`Error parsing data for ${item.deviceId}:`, err)
            }
          })

          // The same principle as when fetching a single row
          setColumnData((prev) => {
            const updated = [...prev]
            const prevValues = prev[columnIndex]?.values
            const deviceParsed = deviceDataMap[row.instance.uid]
            prevValues[rowIndex] = deviceParsed ? deviceParsed[row.parameter.denotation] : null
            updated[columnIndex] = { function: column.function, values: prevValues }
            return updated
          })
        } else {
          setColumnData((prev) => {
            const updated = [...prev]
            const prevValues = prev[columnIndex]?.values
            prevValues[rowIndex] = null
            updated[columnIndex] = { function: column.function, values: prevValues }
            return updated
          })
        }
      } catch (error) {
        console.error('Column fetching error:', error)
      }
    })
  }

  const fetchFullTableData = async (config: TableCardConfig) => {
    if (!config || !config.rows.length || !config.columns.length) return

    // Reset the whole table
    setColumnData(
      config.columns.map((col) => ({
        function: col.function,
        values: config.rows.map(() => null)
      }))
    )

    config.rows.forEach(async (_, rowIndex) => {
      await fetchSingleRowData(config, rowIndex)
    })
  }

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

  const fetchData = async (sensors: SensorField[], from: string, aggregateMinutes: number, operation: string) => {
    const combinedSensors = combineSensors(sensors)
    return fetchTableData({
      variables: {
        sensors: { sensors: combinedSensors },
        request: {
          from: from,
          aggregateMinutes: Math.ceil(aggregateMinutes),
          operation: operation as StatisticsOperation
        }
      }
    })
  }

  const getParameterOptions = (instanceID: number | null, columns: TableCardConfig['columns']): Parameter[] => {
    if (!instanceID) return []
    // Only allow number parameters if any column is an aggregate
    const allParameters = getInstanceParameters(instanceID)
    const numberOnly = columns.some((col) => col.function !== 'last' && col.function !== '')
    if (numberOnly) {
      return allParameters.filter((param) => param.type === SdParameterType.Number)
    }
    return allParameters
  }

  const handleSubmit = (values: TableCardConfig, height: number) => {
    const result: TableCardBuilderResult = {
      config: values,
      sizing: {
        h: Math.max(Math.ceil(height / 20), 3),
        ...(config ? {} : { w: 2 })
      }
    }
    onDataSubmit(result)
  }

  const handleRowDelete = (rowIndex: number) => {
    setColumnData((prev) =>
      prev.map((col) => ({
        ...col,
        values: col.values.filter((_, idx) => idx !== rowIndex)
      }))
    )
  }

  const handleColumnMove = (fromIndex: number, toIndex: number) => {
    setColumnData((prev) => {
      const newColumnData = [...prev]
      const movedColumn = newColumnData.splice(fromIndex, 1)[0]
      newColumnData.splice(toIndex, 0, movedColumn)
      return newColumnData
    })
  }

  const handleColumnDelete = (columnIndex: number) => {
    setColumnData((prev) => prev.filter((_, idx) => idx !== columnIndex))
  }

  const handleRowMove = (fromIndex: number, toIndex: number) => {
    setColumnData((prev) =>
      prev.map((col) => {
        const newValues = [...col.values]
        const [moved] = newValues.splice(fromIndex, 1)
        newValues.splice(toIndex, 0, moved)
        return { ...col, values: newValues }
      })
    )
  }

  return (
    <TableCardBuilderView
      config={config}
      tableData={columnData}
      onSubmit={handleSubmit}
      fetchFullTableData={fetchFullTableData}
      fetchSingleColumnData={fetchSingleColumnData}
      getParameterOptions={getParameterOptions}
      fetchSingleRowData={fetchSingleRowData}
      handleRowDelete={handleRowDelete}
      handleColumnMove={handleColumnMove}
      handleColumnDelete={handleColumnDelete}
      handleRowMove={handleRowMove}
    />
  )
}
