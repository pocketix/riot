import { useEffect, useState } from 'react'
import { SdParameterType, StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { BuilderResult } from '@/types/dashboard/gridItem'
import { EntityCardConfig } from '@/schemas/dashboard/visualizations/EntityCardBuilderSchema'
import { EntityCardBuilderView } from './EntityCardBuilderView'
import { Serie } from '@nivo/line'
import { Parameter, useInstances } from '@/context/InstancesContext'

type EntityCardBuilderResult = BuilderResult<EntityCardConfig>

export interface EntityCardBuilderControllerProps {
  onDataSubmit: (data: EntityCardBuilderResult) => void
  config?: EntityCardConfig
}

export function EntityCardBuilderController({ onDataSubmit, config }: EntityCardBuilderControllerProps) {
  const [sparklineData, setSparklineData] = useState<Serie[]>([])

  const { getInstanceParameters } = useInstances()
  const [fetchData] = useStatisticsQuerySensorsWithFieldsLazyQuery()

  // Initialize with config values if provided
  useEffect(() => {
    if (config) {
      config.rows.forEach((row, rowIndex) => {
        checkRowAndFetch(row, rowIndex)
      })
    }
  }, [config])

  const checkRowAndFetch = async (rowData: EntityCardConfig['rows'][number], rowIndex: number) => {
    if (!rowData?.instance?.uid || !rowData?.parameter?.id || !rowData?.visualization) {
      return
    }

    // Only sparkline data fetching is needed,
    //  the responsive entity table component handles others
    if (rowData.visualization === 'sparkline') {
      await fetchSparklineData(rowData, rowIndex)
    }
  }

  const fetchSparklineData = async (rowData: EntityCardConfig['rows'][number], rowIndex: number) => {
    if (!rowData?.instance?.uid || !rowData?.parameter?.denotation) return

    try {
      const result = await fetchData({
        variables: {
          sensors: {
            sensors: [{ key: rowData.instance.uid, values: [rowData.parameter.denotation] }]
          },
          request: {
            from: new Date(Date.now() - Number(rowData.timeFrame || 24) * 60 * 60 * 1000).toISOString(),
            aggregateMinutes: Math.ceil((Number(rowData.timeFrame || 24) * 60) / 32),
            operation: StatisticsOperation.Last
          }
        }
      })

      if (result.data?.statisticsQuerySensorsWithFields.length! > 0) {
        const rawData = result.data?.statisticsQuerySensorsWithFields
        const sparklinePoints = rawData?.map((item: any) => {
          const value = JSON.parse(item.data)
          return {
            x: item.time,
            y: value[rowData.parameter.denotation]
          }
        })

        setSparklineData((prevData) => {
          const newData = [...prevData]
          newData[rowIndex] = {
            id: rowData.name + rowIndex,
            data: sparklinePoints || []
          }
          return newData
        })
      }
    } catch (error) {
      console.error('Error fetching sparkline data', error)
    }
  }

  const getParameterOptions = (instanceID: number | null, visualization: string | null): Parameter[] => {
    if (!instanceID) return []

    const allParameters = getInstanceParameters(instanceID)

    // Filter based on the visualization, immediate supports all types
    if (visualization === 'sparkline') {
      return allParameters.filter((param) => param.type === SdParameterType.Number)
    } else if (visualization === 'switch') {
      return allParameters.filter((param) => param.type === SdParameterType.Boolean)
    }

    return allParameters
  }

  const handleSubmit = (values: EntityCardConfig, height: number) => {
    const result: EntityCardBuilderResult = {
      config: values,
      sizing: {
        w: 1,
        h: Math.max(Math.ceil(height / 20), 3)
      }
    }
    onDataSubmit(result)
  }

  const handleRowMove = (fromIndex: number, toIndex: number) => {
    setSparklineData((prevData) => {
      const newData = [...prevData]

      while (newData.length <= Math.max(fromIndex, toIndex)) {
        newData.push({ id: '', data: [] })
      }

      if (typeof newData[fromIndex] === 'undefined') return newData

      const [movedRow] = newData.splice(fromIndex, 1)
      newData.splice(toIndex, 0, movedRow)
      return newData
    })
  }

  return (
    <EntityCardBuilderView
      config={config}
      onSubmit={handleSubmit}
      onCheckRowAndFetch={checkRowAndFetch}
      getParameterOptions={getParameterOptions}
      sparklineData={sparklineData}
      handleRowMove={handleRowMove}
    />
  )
}
