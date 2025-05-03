import { useInstances } from '@/context/InstancesContext'
import { SequentialStatesBuilderView } from './SequentialStatesBuilderView'
import { BuilderResult } from '@/types/dashboard/gridItem'
import { SequentialStatesCardConfig } from '@/schemas/dashboard/visualizations/SequentialStatesBuilderSchema'
import { Datum } from '@nivo/line'
import { useEffect, useState } from 'react'
import { StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { toast } from 'sonner'

interface SequentialStatesBuilderControllerProps {
  onDataSubmit: (data: BuilderResult<SequentialStatesCardConfig>) => void
  config?: SequentialStatesCardConfig
}

export function SequentialStatesBuilderController(props: SequentialStatesBuilderControllerProps) {
  const { getInstanceParameters } = useInstances()
  const [chartData, setChartData] = useState<Datum[]>([])
  const [fetchPreview] = useStatisticsQuerySensorsWithFieldsLazyQuery()

  const getParameterOptions = (instanceID: number | null) => {
    if (!instanceID) return []
    return getInstanceParameters(instanceID)
  }

  const fetchPreviewData = async (instanceUid: string, parameterDenotation: string, timeFrame: string) => {
    if (!instanceUid || !parameterDenotation || !timeFrame) {
      setChartData([])
      return
    }

    const fromTime = new Date(Date.now() - Number(timeFrame) * 60 * 60 * 1000).toISOString()
    const { data } = await fetchPreview({
      variables: {
        sensors: { sensors: [{ key: instanceUid, values: [parameterDenotation] }] },
        request: {
          from: fromTime,
          aggregateMinutes: 1,
          operation: StatisticsOperation.Last
        }
      }
    })

    const parsedData: Datum[] = []
    if (data?.statisticsQuerySensorsWithFields?.length) {
      const items = data.statisticsQuerySensorsWithFields
      for (const item of items) {
        const parsed = item.data ? JSON.parse(item.data) : null
        if (parsed && parsed[parameterDenotation] !== undefined) {
          parsedData.push({
            x: item.time,
            y: parsed[parameterDenotation]
          })
        }
      }
    }

    if (parsedData.length === 0) {
      toast.error('No data available for the selected instance and parameter.')
    }

    setChartData(parsedData)
  }

  useEffect(() => {
    if (props.config) {
      const instance = props.config.instance
      const parameter = props.config.parameter
      const timeFrame = props.config.timeFrame

      if (instance?.uid && parameter?.denotation) {
        fetchPreviewData(instance.uid, parameter.denotation, timeFrame)
      }
    }
  }, [props.config])

  const ereaseData = () => {
    setChartData([])
  }

  const handleSubmit = (values: SequentialStatesCardConfig) => {
    props.onDataSubmit({
      config: values,
      sizing: {
        minH: values.title ? 4 : 3,
        h: 5,
        ...(props.config ? {} : { w: 2 })
      }
    })
  }

  return (
    <SequentialStatesBuilderView
      data={chartData}
      config={props.config}
      onSubmit={handleSubmit}
      getParameterOptions={getParameterOptions}
      fetchPreviewData={fetchPreviewData}
      ereaseData={ereaseData}
    />
  )
}
