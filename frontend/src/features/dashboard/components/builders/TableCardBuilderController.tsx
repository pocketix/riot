import { useEffect, useState } from 'react'
import {
  SdParameterType,
  SensorField,
  StatisticsOperation,
  useStatisticsQuerySensorsWithFieldsLazyQuery
} from '@/generated/graphql'
import { BuilderResult } from '@/types/dashboard/gridItem'
import { TableCardConfig } from '@/schemas/dashboard/TableBuilderSchema'
import { TableCardBuilderView } from './TableCardBuilderView'
import { Parameter, useInstances } from '@/context/InstancesContext'
import { TableRowData } from '../visualizations/ResponsiveTable'

type TableCardBuilderResult = BuilderResult<TableCardConfig>

export interface TableCardBuilderControllerProps {
  onDataSubmit: (data: TableCardBuilderResult) => void
  config?: TableCardConfig
}

export function TableCardBuilderController({ onDataSubmit, config }: TableCardBuilderControllerProps) {
  const [tableData, setTableData] = useState<TableRowData[]>([])
  const [fetchTableData] = useStatisticsQuerySensorsWithFieldsLazyQuery()
  const { getInstanceParameters } = useInstances()

  useEffect(() => {
    if (config) {
      fetchFullTableData(config)
    }
  }, [config])

  const handleRowRename = (rowIndex: number, newName: string) => {
    setTableData((prevData) => {
      const updatedData = [...prevData]
      updatedData[rowIndex] = {
        ...updatedData[rowIndex],
        name: newName
      }
      return updatedData
    })
  }

  const fetchSingleRowData = async (
    rowData: TableCardConfig['rows'][number],
    rowIndex: number,
    columns: TableCardConfig['columns'],
    timeFrame: string
  ) => {
    if (!rowData?.instance?.uid || !rowData?.parameter?.denotation) {
      return
    }

    // Get columns that need to be fetched
    const aggregatedColumns = columns.filter((column) => column.function !== 'last' && column.function !== '')

    const newRow: TableRowData = {
      ...rowData,
      values: columns.map((column) => ({
        function: column.function,
        value: undefined
      }))
    }

    setTableData((prevData) => {
      const updatedData = [...prevData]

      // Make space for the new data
      while (updatedData.length <= rowIndex) {
        updatedData.push({
          name: '',
          instance: { uid: '', id: null },
          parameter: { id: null, denotation: '' },
          values: []
        })
      }

      // Insert the new row, which does not have any values yet
      updatedData[rowIndex] = newRow
      return updatedData
    })

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

      // Fill in the values for this row
      aggregatedColumns.forEach((column, idx) => {
        const columnData = parsedData[idx]

        if (columnData) {
          const instanceData = columnData.find((data: any) => data.deviceId === rowData.instance.uid)
          if (instanceData) {
            try {
              const parsedValue = JSON.parse(instanceData.data)
              newRow.values[idx] = {
                function: column.function,
                value: parsedValue[rowData.parameter.denotation]
              }
            } catch (e) {
              console.error('Error parsing data:', e)
            }
          }
        }
      })

      setTableData((prevData) => {
        const updatedData = [...prevData]
        updatedData[rowIndex] = newRow
        console.log('Updated row data:', updatedData[rowIndex])
        return updatedData
      })
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const checkRowAndFetch = async (config: TableCardConfig, rowIndex: number) => {
    if (!config.rows[rowIndex]?.instance?.uid || !config.rows[rowIndex]?.parameter?.denotation) {
      return
    }

    await fetchSingleRowData(config.rows[rowIndex], rowIndex, config.columns, config.timeFrame)
  }

  const handleRowDelete = (removedIndex: number) => {
    setTableData((prevData) => {
      const updatedData = [...prevData]
      updatedData.splice(removedIndex, 1)
      return updatedData
    })
  }

  const fetchFullTableData = async (config: TableCardConfig) => {
    if (!config || !config.rows.length || !config.columns.length) return

    const validRows = config.rows.filter((row) => row.instance?.uid && row.parameter?.denotation)

    if (!validRows.length) return

    const sensors: SensorField[] = validRows.map((row) => ({
      key: row.instance.uid,
      values: [row.parameter.denotation]
    }))

    const combinedSensors = combineSensors(sensors)

    const aggregatedColumns = config.columns.filter((column) => column.function !== 'last' && column.function !== '')

    const rows = config.rows.map((row) => ({
      ...row,
      values: config.columns.map((column) => ({
        function: column.function,
        value: undefined
      }))
    }))

    if (aggregatedColumns.length === 0 || combinedSensors.length === 0) {
      setTableData(rows)
      return
    }

    try {
      const results = await Promise.allSettled(
        aggregatedColumns.map((column) =>
          fetchData(
            combinedSensors,
            new Date(Date.now() - Number(config.timeFrame) * 60 * 60 * 1000).toISOString(),
            Number(config.timeFrame) * 60 * 1000,
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

      const updatedRows = config.rows.map((row) => {
        const values = config.columns.map((column) => ({
          function: column.function,
          value: undefined
        }))

        aggregatedColumns.forEach((column, idx) => {
          const columnData = parsedData[idx]

          if (columnData) {
            const instanceData = columnData.find((data: any) => data.deviceId === row.instance.uid)
            if (instanceData) {
              try {
                let parsedValue = JSON.parse(instanceData.data)
                values[idx] = {
                  function: column.function,
                  value: parsedValue[row.parameter.denotation]
                }
              } catch (e) {
                console.error('Error parsing data:', e)
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
    return fetchTableData({
      variables: {
        sensors: { sensors },
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
        w: 2,
        h: Math.max(Math.ceil(height / 20), 3)
      }
    }
    onDataSubmit(result)
  }

  return (
    <TableCardBuilderView
      config={config}
      tableData={tableData}
      onSubmit={handleSubmit}
      checkRowAndFetch={checkRowAndFetch}
      handleRowDelete={handleRowDelete}
      fetchFullTableData={fetchFullTableData}
      getParameterOptions={getParameterOptions}
      handleRowRename={handleRowRename}
    />
  )
}
