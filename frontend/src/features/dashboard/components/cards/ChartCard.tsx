import { Serie } from '@nivo/line'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { lineChartBuilderSchema, ChartCardConfig } from '@/schemas/dashboard/LineChartBuilderSchema'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BuilderResult } from '@/types/dashboard/GridItem'
import { SensorField, StatisticsInput, StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { ResponsiveLineChart } from '../visualizations/ResponsiveLineChart'
import { BaseCard } from './BaseCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Layout } from 'react-grid-layout'

interface ChartCardProps {
  cardID: string
  handleDeleteItem: (id: string) => void
  setLayout: (layout: Layout[]) => void
  setHighlightedCardID: (id: string) => void
  layout: Layout[]
  breakPoint: string
  editModeEnabled: boolean
  cols: { lg: number; md: number; sm: number; xs: number; xxs: number }
  height: number
  width: number
  configuration: any
  breakpoint: string
  beingResized: boolean
  handleSaveEdit: (config: BuilderResult<ChartCardConfig>) => void
}

export const ChartCard = (props: ChartCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<Serie[]>([])
  const [chartConfig, setChartConfig] = useState<ChartCardConfig>()
  const [unavailableData, setUnavailableData] = useState<{ device: string; parameter: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  const [getChartData, { data: fetchedChartData }] = useStatisticsQuerySensorsWithFieldsLazyQuery({
    pollInterval: chartConfig?.aggregateMinutes ? chartConfig.aggregateMinutes * 60 * 1000 : 0
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
    if (chartConfig) {
      const instances = chartConfig?.instances
      if (!instances) return

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
  }

  useEffect(() => {
    if (props.configuration) {
      const parsedConfig = lineChartBuilderSchema.safeParse(props.configuration.visualizationConfig)
      if (parsedConfig.success) {
        setChartConfig(parsedConfig.data)
      } else {
        setError('Failed to parse configuration')
        console.error('Failed to parse configuration', parsedConfig.error)
        toast.error('Failed to parse configuration')
      }
    }
  }, [props.configuration])

  useEffect(() => {
    if (chartConfig) {
      fetchData()
    }
  }, [chartConfig])

  useEffect(() => {
    if (!chartConfig) return
    if (!fetchedChartData) return

    const instances = chartConfig?.instances
    let result: Serie[] = []

    instances.forEach((instance) => {
      const sensorDataArray = fetchedChartData.statisticsQuerySensorsWithFields.filter(
        (item) => item.deviceId === instance.uid
      )

      instance.parameters.forEach((param) => {
        const paramData = {
          id: param.id + ' ' + instance.id,
          data:
            sensorDataArray.length > 0
              ? sensorDataArray.map((sensorData: any) => {
                  const parsedData = sensorData.data ? JSON.parse(sensorData.data) : null
                  return {
                    x: sensorData.time,
                    y: parsedData[param.denotation]
                  }
                })
              : []
        }
        if (paramData.data?.length === 0) {
          setUnavailableData((prev) => [...prev, { device: instance.uid, parameter: param.denotation }])
          return
        }
        result.push(paramData)
      })
    })

    setData(result)
  }, [fetchedChartData, chartConfig])

  const isLoading = !chartConfig || !data || data.length === 0

  return (
    <BaseCard<ChartCardConfig>
      {...props}
      isLoading={isLoading}
      error={error}
      visualizationType="line"
      cardTitle={chartConfig?.cardTitle}
      configuration={chartConfig!}
    >
      <>
        {unavailableData?.length > 0 && (
          <div className="absolute right-2 top-0 z-10">
            <Skeleton className="h-full w-fit p-1 pt-0" disableAnimation>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate text-xs font-semibold text-destructive">Unavailable</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex max-w-28 flex-col">
                      <span className="text-center font-bold text-destructive">No data available</span>
                      {unavailableData?.map((row) => (
                        <div key={row.device + row.parameter} className="flex w-full flex-col">
                          <span className="break-words text-center text-xs text-gray-500">Device: {row.device}</span>
                          <span className="break-words text-center text-xs text-gray-500">
                            Parameter: {row.parameter}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Skeleton>
          </div>
        )}
        <ResponsiveLineChart data={data} config={chartConfig} ref={containerRef} />
      </>
    </BaseCard>
  )
}
