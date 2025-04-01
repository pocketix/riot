import { useEffect, useMemo, useRef, useState } from 'react'
import {
  SdParameterType,
  StatisticsOperation,
  useSdInstancesQuery,
  useSdTypeParametersQuery,
  useStatisticsQuerySensorsWithFieldsQuery
} from '@/generated/graphql'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { Skeleton } from '@/components/ui/skeleton'
import { CustomLayerProps, PointTooltipProps, ResponsiveLine, Serie } from '@nivo/line'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../../cards/components/ChartThemes'
import { getMaxValue, timeTicksLayer } from '../../utils/charts/tickUtils'
import { ChartToolTip } from '../../cards/tooltips/LineChartToolTip'
import { SingleParameterCombobox } from '../../builders/components/single-parameter-combobox'
import { SequentialStatesVisualization } from '../components/SequentialStatesVisualization'
import { TimeFrameSelector } from '../../builders/components/time-frame-selector'

export const DeviceDetail = () => {
  const { selectedDevice, isOpen, setIsOpen } = useDeviceDetail()
  const { data: instances } = useSdInstancesQuery()
  const { isDarkMode } = useDarkMode()
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState<string>('24')

  useEffect(() => {
    setSelectedParameter(null)
  }, [selectedDevice?.uid])

  const instance = useMemo(
    () => (selectedDevice ? instances?.sdInstances.find((instance) => instance.uid === selectedDevice.uid) : undefined),
    [selectedDevice, instances]
  )

  const { data: parameters } = useSdTypeParametersQuery({
    variables: { sdTypeId: instance?.type.id! },
    skip: !instance?.type?.id
  })

  const currentParameter = useMemo(() => {
    return selectedParameter || selectedDevice?.parameter || null
  }, [selectedParameter, selectedDevice?.parameter, parameters?.sdType.parameters])

  const wholeParameter = useMemo(
    () => parameters?.sdType.parameters.find((param) => param.denotation === currentParameter),
    [parameters?.sdType.parameters, currentParameter]
  )

  const queryVariables = useMemo(() => {
    if (!selectedDevice?.uid || !currentParameter || !wholeParameter) {
      return null
    }

    const isNumberType = wholeParameter.type === SdParameterType.Number
    const fromTime = new Date(new Date().getTime() - Number(timeFrame) * 60 * 60 * 1000).toISOString()

    return {
      sensors: {
        sensors: [
          {
            key: selectedDevice.uid,
            values: [currentParameter]
          }
        ]
      },
      request: {
        from: fromTime,
        aggregateMinutes: isNumberType ? Math.ceil(Number(timeFrame)) : 0,
        operation: StatisticsOperation.Last
      }
    }
  }, [selectedDevice?.uid, currentParameter, wholeParameter, timeFrame])

  const { data: graphData } = useStatisticsQuerySensorsWithFieldsQuery({
    variables: queryVariables!,
    skip: !queryVariables || !isOpen
  })

  const processedData: Serie[] = useMemo(() => {
    if (!graphData || !currentParameter) return []

    const sensorDataArray = graphData.statisticsQuerySensorsWithFields.filter(
      (item) => item.deviceId === selectedDevice?.uid
    )

    if (sensorDataArray.length === 0) return []

    // sort the data by time, without sorting, artefacts can occur
    const sortedSensorDataArray = sensorDataArray.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    )

    return [
      {
        id: currentParameter + ' ' + selectedDevice?.uid,
        data: sortedSensorDataArray
          .map((sensorData) => {
            const parsedData = sensorData.data ? JSON.parse(sensorData.data) : null
            return {
              x: sensorData.time,
              y: parsedData?.[currentParameter] ?? null
            }
          })
          .filter((point) => point.y !== null)
      }
    ]
  }, [graphData, selectedDevice, currentParameter])

  const renderVisualization = () => {
    if (processedData.length === 0) {
      return (
        <Skeleton className="h-[200px] w-full">
          <div className="flex h-full w-full flex-col items-center justify-center">
            <p className="text-destructive">No data available</p>
            <p className="break-words text-center text-lg">Please select a different time frame or parameter</p>
          </div>
        </Skeleton>
      )
    }

    if (wholeParameter?.type === SdParameterType.Number) {
      console.log('processedData', processedData)
      return (
        <div className="h-[200px] w-full min-w-0" ref={containerRef}>
          <ResponsiveLine
            data={processedData}
            margin={{ top: 10, right: 20, bottom: 50, left: 40 }}
            xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%SZ', useUTC: true }}
            xFormat="time:%Y-%m-%d %H:%M:%S"
            animate={true}
            useMesh={true}
            yScale={{ type: 'linear', min: 'auto', max: getMaxValue(processedData) * 1.01, stacked: false, nice: true }}
            axisBottom={{
              tickValues: 0 // we are generating the axis ticks manually
            }}
            curve="linear"
            axisLeft={{
              legendOffset: -50,
              legendPosition: 'middle',
              format: '~s',
              tickValues: 6
            }}
            layers={[
              'grid',
              'axes',
              'crosshair',
              'lines',
              'points',
              'mesh',
              'slices',
              (props: CustomLayerProps) =>
                timeTicksLayer({
                  xScale: props.xScale,
                  data: processedData[0] ? processedData[0].data : [],
                  isDarkMode,
                  width: props.innerWidth,
                  height: props.innerHeight,
                  enableGridX: true
                })
            ]}
            pointSize={5}
            pointColor={isDarkMode ? '#ffffff' : '#000000'}
            pointBorderWidth={1}
            pointBorderColor={{ from: 'serieColor' }}
            enableGridX={false}
            enableGridY={true}
            enableCrosshair={true}
            enableTouchCrosshair={true}
            colors={isDarkMode ? { scheme: 'category10' } : { scheme: 'pastel1' }}
            theme={isDarkMode ? darkTheme : lightTheme}
            tooltip={(pos: PointTooltipProps) => {
              const capitalize = (str: string): string => {
                return str.charAt(0).toUpperCase() + str.slice(1)
              }

              const yName = capitalize(wholeParameter.label || wholeParameter.denotation || 'Value')
              const instanceName = capitalize(instance?.userIdentifier!)

              return (
                <ChartToolTip
                  position={pos}
                  containerRef={containerRef}
                  instanceName={instanceName}
                  xName={'Time'}
                  yName={yName}
                />
              )
            }}
          />
        </div>
      )
    } else {
      return <SequentialStatesVisualization data={processedData[0].data} />
    }
  }

  return (
    <Dialog open={isOpen && !!selectedDevice} onOpenChange={(open) => setIsOpen(open)}>
      <DialogContent className="gap-2 overflow-hidden sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="break-words text-lg sm:text-xl">{instance?.userIdentifier!}</DialogTitle>
          <DialogDescription className="mt-2 space-y-1">
            <div className="flex flex-col items-center gap-1 sm:flex-row">
              <code className="block w-fit break-all rounded bg-muted px-1.5 py-1 font-mono text-xs">
                {selectedDevice?.uid}
              </code>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:flex-row">
            <span className="text-sm">Displayed parameter: </span>
            <code className="block min-h-6 w-fit min-w-10 break-words rounded bg-muted px-1.5 py-1 font-mono text-xs">
              {currentParameter}
            </code>
          </div>
          <div className="flex flex-col gap-2">
            <SingleParameterCombobox
              options={(parameters?.sdType.parameters || []).map((param) => ({
                ...param,
                parameterSnapshots: []
              }))}
              onValueChange={(value) => setSelectedParameter(value?.denotation || null)}
              value={
                currentParameter
                  ? parameters?.sdType.parameters.find((param) => param.denotation === currentParameter) || null
                  : null
              }
              className="w-48"
            />
            <TimeFrameSelector onValueChange={(value) => setTimeFrame(value!)} value={timeFrame} className="w-48" />
          </div>
        </div>

        {renderVisualization()}
      </DialogContent>
    </Dialog>
  )
}
