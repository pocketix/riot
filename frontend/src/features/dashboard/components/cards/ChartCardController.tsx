import { Serie } from '@nivo/line'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { lineChartBuilderSchema, ChartCardConfig } from '@/schemas/dashboard/LineChartBuilderSchema'
import {
  SensorField,
  StatisticsInput,
  StatisticsOperation,
  useStatisticsQuerySensorsWithFieldsLazyQuery
} from '@/generated/graphql'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { ChartCardView } from './ChartCardView'

type ChartCardProps = BaseVisualizationCardProps<ChartCardConfig>

export const ChartCardController = (props: ChartCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<Serie[]>([])
  const [chartConfig, setChartConfig] = useState<ChartCardConfig>()
  const [unavailableData, setUnavailableData] = useState<{ device: string; parameter: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refetchInterval = useMemo(() => {
    if (chartConfig?.aggregateMinutes) {
      // refetch based on the aggregate time frame, so that we get a new point each time
      return chartConfig.aggregateMinutes * 60 * 1000
    }
    return 0
  }, [chartConfig])

  const [getChartData, { data: fetchedChartData, loading: chartLoading }] =
    useStatisticsQuerySensorsWithFieldsLazyQuery({
      pollInterval: refetchInterval
    })

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

  const fetchData = () => {
    if (!chartConfig || !props.isVisible) return

    setIsLoading(true)
    const instances = chartConfig?.instances
    if (!instances) {
      // should not happen
      setIsLoading(false)
      return
    }

    const sensorsRAW = instances.map((instance: { uid: string; parameters: { denotation: string }[] }) => ({
      key: instance.uid,
      values: instance.parameters ? instance.parameters.map((param) => param.denotation) : []
    }))

    const sensors = combineSensors(sensorsRAW)

    const request: StatisticsInput = {
      from: new Date(Date.now() - Number(chartConfig.timeFrame) * 60 * 60 * 1000).toISOString(),
      aggregateMinutes: chartConfig.aggregateMinutes,
      operation: StatisticsOperation.Last
    }

    getChartData({
      variables: {
        sensors: { sensors },
        request
      }
    })
  }

  useEffect(() => {
    if (props.configuration) {
      setIsLoading(true)
      setUnavailableData([])
      const parsedConfig = lineChartBuilderSchema.safeParse(props.configuration.visualizationConfig)
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

  useEffect(() => {
    if (chartConfig && props.isVisible) {
      fetchData()
    }
  }, [chartConfig, props.isVisible])

  useEffect(() => {
    if (!chartConfig || !fetchedChartData) return

    const instances = chartConfig?.instances
    let result: Serie[] = []
    const unavailableItems: { device: string; parameter: string }[] = []

    instances.forEach((instance) => {
      const sensorDataArray = fetchedChartData.statisticsQuerySensorsWithFields.filter(
        (item) => item.deviceId === instance.uid
      )

      instance.parameters.forEach((param) => {
        const paramData = {
          id: param.id + ' ' + instance.id,
          data:
            sensorDataArray.length > 0
              ? sensorDataArray
                  .map((sensorData) => {
                    const parsedData = sensorData.data ? JSON.parse(sensorData.data) : null
                    return {
                      x: sensorData.time,
                      y: parsedData && parsedData[param.denotation] !== undefined ? parsedData[param.denotation] : null
                    }
                  })
                  .filter((point) => point.y !== null)
              : []
        }

        if (paramData.data?.length === 0) {
          unavailableItems.push({ device: instance.uid, parameter: param.denotation })
        } else {
          result.push(paramData)
        }
      })
    })

    setData(result)
    setUnavailableData(unavailableItems)
    setIsLoading(result.length === 0)
  }, [fetchedChartData, chartConfig])

  return (
    <ChartCardView
      {...props}
      data={data}
      chartConfig={chartConfig}
      error={error}
      isLoading={isLoading || chartLoading}
      unavailableData={unavailableData}
      containerRef={containerRef}
    />
  )
}
