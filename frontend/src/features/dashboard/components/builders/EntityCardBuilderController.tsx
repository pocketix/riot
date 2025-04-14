import { useEffect, useState } from 'react'
import { SdParameterType, StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { BuilderResult } from '@/types/dashboard/gridItem'
import { EntityCardConfig } from '@/schemas/dashboard/EntityCardBuilderSchema'
import { EntityCardBuilderView } from './EntityCardBuilderView'
import { Serie } from '@nivo/line'
import { Parameter, useInstances } from '@/context/InstancesContext'

type EntityCardBuilderResult = BuilderResult<EntityCardConfig>

export interface EntityCardBuilderControllerProps {
  onDataSubmit: (data: EntityCardBuilderResult) => void
  config?: EntityCardConfig
}

export function EntityCardBuilderController({ onDataSubmit, config }: EntityCardBuilderControllerProps) {
  const [sparklineData, setSparklineData] = useState<Record<string, Serie[]>>({})

  const { getInstanceParameters } = useInstances()
  const [fetchData] = useStatisticsQuerySensorsWithFieldsLazyQuery()

  // Initialize with config values if provided
  useEffect(() => {
    if (config) {
      config.rows.forEach((row) => {
        checkRowAndFetch(row)
      })
    }
  }, [config])

  const checkRowAndFetch = async (rowData: EntityCardConfig['rows'][number]) => {
    if (!rowData?.instance?.uid || !rowData?.parameter?.id || !rowData?.visualization) {
      return
    }

    // Only sparkline data fetching is needed,
    //  the responsive entity table component handles others
    if (rowData.visualization === 'sparkline') {
      await fetchSparklineData(rowData)
    }
  }

  const fetchSparklineData = async (rowData: EntityCardConfig['rows'][number]) => {
    if (!rowData?.instance?.uid || !rowData?.parameter?.denotation) return

    const rowId = `${rowData.instance.id}-${rowData.parameter.id}`

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

        setSparklineData((prev) => ({
          ...prev,
          [rowId]: [{ id: rowId, data: sparklinePoints! }]
        }))
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

  return (
    <EntityCardBuilderView
      config={config}
      onSubmit={handleSubmit}
      onCheckRowAndFetch={checkRowAndFetch}
      getParameterOptions={getParameterOptions}
      sparklineData={sparklineData}
    />
  )
}
