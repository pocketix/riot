import { Container, DeleteEditContainer, DragHandle } from '@/styles/dashboard/CardGlobal'
import { AiOutlineDrag } from 'react-icons/ai'
import { Serie } from '@nivo/line'
import styled from 'styled-components'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ItemDeleteAlertDialog } from './components/ItemDeleteAlertDialog'
import { Layout } from 'react-grid-layout'
import { AccessibilityContainer } from './components/AccessibilityContainer'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { lineChartBuilderSchema, ChartCardConfig } from '@/schemas/dashboard/LineChartBuilderSchema'
import { CardEditDialog } from '../editors/CardEditDialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BuilderResult } from '@/types/dashboard/GridItem'
import { StatisticsInput, StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { ResponsiveLineChart } from '../visualizations/ResponsiveLineChart'

// Styled components
export const ChartContainer = styled.div<{ $editModeEnabled?: boolean }>`
  position: relative;
  margin: 0;
  padding: 0;
  min-width: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-grow: 1;
  overflow: hidden;
  opacity: ${(props) => (props.$editModeEnabled ? 0.25 : 1)};
  transition: opacity 0.3s;
  border-radius: 12px;
  user-select: none;
  touch-action: none;
`

interface ChartCardProps {
  cardID: string
  handleDeleteItem: (id: string) => void
  setLayout: (layout: Layout[]) => void
  setHighlightedCardID: (id: string) => void
  title: string
  layout: Layout[]
  breakPoint: string
  editModeEnabled: boolean
  cols: { lg: number; md: number; sm: number; xs: number; xxs: number }
  height: number
  width: number
  configuration: any
  breakpoint: string // TODO: unused
  beingResized: boolean
  handleSaveEdit: (config: BuilderResult<ChartCardConfig>) => void
}

export const ChartCard = ({
  cardID,
  layout,
  setLayout,
  cols,
  breakPoint,
  editModeEnabled,
  handleDeleteItem,
  width,
  height,
  setHighlightedCardID,
  configuration,
  beingResized,
  handleSaveEdit
}: ChartCardProps) => {
  const [highlight, setHighlight] = useState<'width' | 'height' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<Serie[]>([])
  const [chartConfig, setChartConfig] = useState<ChartCardConfig>()
  const [unavilableData, setUnavailableData] = useState<{ device: string; parameter: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [getChartData, { data: fetchedChartData }] = useStatisticsQuerySensorsWithFieldsLazyQuery({
    pollInterval: chartConfig?.aggregateMinutes ? chartConfig.aggregateMinutes * 60 * 1000 : 0
  })

  const fetchData = () => {
    console.log('Chart config', chartConfig)
    if (chartConfig) {
      const instances = chartConfig?.instances
      if (!instances) return
      console.log('Fetching data')
      const sensors = instances.map((instance: { uid: string; parameters: { denotation: string }[] }) => ({
        key: instance.uid,
        values: instance.parameters ? instance.parameters.map((param) => param.denotation) : []
      }))

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
    if (configuration) {
      const parsedConfig = lineChartBuilderSchema.safeParse(configuration.visualizationConfig)
      console.log('Parsed config', parsedConfig)
      console.log(configuration)
      if (parsedConfig.success) {
        console.log('Parsed config', parsedConfig.data)
        setChartConfig(parsedConfig.data)
      } else {
        setError('Failed to parse configuration')
        console.error('Failed to parse configuration', parsedConfig.error)
        toast.error('Failed to parse configuration')
      }
    }
  }, [configuration])

  useEffect(() => {
    if (chartConfig) {
      fetchData()
    }
  }, [chartConfig])

  useEffect(() => {
    if (!chartConfig) return
    if (!fetchedChartData) return
    const instances = chartConfig?.instances

    let result: any[] = []

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
          // toast.error('One or more of the selected parameters have no data available for the selected time frame.')
          return
        }
        result.push(paramData)
      })
    })

    console.log('Line chart result', result)
    setData(result)
  }, [fetchedChartData])

  useEffect(() => {
    console.log('unavailable data', unavilableData)
  }, [unavilableData])

  const item = useMemo(() => layout.find((item) => item.i === cardID), [layout, cardID])

  let isAtRightEdge = false
  let isAtLeftEdge = false
  let isAtTopEdge = false
  let isBottom = false

  if (item) {
    isAtRightEdge = useMemo(() => {
      return item?.x + item?.w === cols[breakPoint as keyof typeof cols]
    }, [item, cols, breakPoint])

    isAtLeftEdge = useMemo(() => {
      return item?.x === 0
    }, [item])

    isAtTopEdge = useMemo(() => {
      return item?.y === 0
    }, [item])

    // Check if there are any items below
    isBottom = useMemo(() => {
      return layout.some((l) => l.y === item.y + item.h && l.x < item.x + item.w && l.x + l.w > item.x)
    }, [layout, item])
  }

  useEffect(() => {
    if (highlight) setHighlightedCardID(cardID)
  }, [cardID, highlight])

  // TODO: Alert
  if (!chartConfig || !data || beingResized || error)
    return (
      <>
        <Skeleton className="h-full w-full" />
        {error && (
          <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center rounded-lg bg-red-500 text-white">
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}
        {editModeEnabled && (
          <DeleteEditContainer>
            <ItemDeleteAlertDialog onSuccess={() => handleDeleteItem(cardID)} />
          </DeleteEditContainer>
        )}
      </>
    )

  return (
    <Container key={cardID} className={`${cardID}`}>
      {editModeEnabled && (
        <DragHandle>
          <AiOutlineDrag className="drag-handle h-[40px] w-[40px] rounded-lg border-2 p-1" />
        </DragHandle>
      )}
      {editModeEnabled && (
        <DeleteEditContainer>
          <CardEditDialog config={chartConfig} onSave={handleSaveEdit} visualizationType="line" />
          <ItemDeleteAlertDialog onSuccess={() => handleDeleteItem(cardID)} />
        </DeleteEditContainer>
      )}
      <div className="flex w-full items-center justify-between p-2 pb-0 font-semibold">
        <span>{chartConfig.cardTitle}</span>
        {unavilableData?.length! > 0 && (
          <Skeleton className="h-full w-fit p-1 pt-0" disableAnimation>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <TooltipTrigger asChild>
                    <span className="truncate text-xs font-semibold text-destructive">Unavailable</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex max-w-28 flex-col">
                      <span className="text-center font-bold text-destructive">No data available</span>
                      {unavilableData?.map((row) => (
                        <div key={row.device + row.parameter} className="flex w-full flex-col">
                          <span className="break-words text-center text-xs text-gray-500">Device: {row.device}</span>
                          <span className="break-words text-center text-xs text-gray-500">
                            Parameter: {row.parameter}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
          </Skeleton>
        )}
      </div>
      <ChartContainer $editModeEnabled={editModeEnabled}>
        <ResponsiveLineChart data={data} config={chartConfig} ref={containerRef} />{' '}
      </ChartContainer>
      {editModeEnabled && (
        <AccessibilityContainer
          cols={cols}
          layout={layout}
          setLayout={setLayout}
          breakPoint={breakPoint}
          cardID={cardID}
          setHighlight={setHighlight}
          isAtRightEdge={isAtRightEdge}
          isAtLeftEdge={isAtLeftEdge}
          isAtTopEdge={isAtTopEdge}
          isBottom={isBottom}
        />
      )}
      {/* TODO: use styled components */}
      {highlight === 'width' && (
        <>
          {!isAtRightEdge && item?.w !== item?.maxW && (
            <div
              style={{ width: `${width}px` }}
              className={`absolute left-full top-0 h-full ${highlight ? 'opacity-50' : 'opacity-0'} rounded-r-lg bg-green-400 transition-opacity duration-200`}
            />
          )}
          {item?.w !== 1 && item?.w !== item?.minW && (
            <div
              style={{ width: `${width}px` }}
              className={`absolute right-0 top-0 h-full ${highlight ? 'opacity-50' : 'opacity-0'} rounded-r-lg bg-red-400 transition-opacity duration-200`}
            />
          )}
        </>
      )}
      {highlight === 'height' && (
        <>
          {item?.h !== item?.maxH && (
            <div
              style={{ height: `${height}px` }}
              className={`absolute left-0 top-full w-full ${highlight ? 'opacity-50' : 'opacity-0'} rounded-b-lg bg-green-400 transition-opacity duration-200`}
            />
          )}
          {item?.h !== item?.minH && item?.h !== 1 && (
            <div
              style={{ height: `${height}px` }}
              className={`absolute bottom-0 left-0 w-full ${highlight ? 'opacity-50' : 'opacity-0'} rounded-b-lg bg-red-400 transition-opacity duration-200`}
            />
          )}
        </>
      )}
    </Container>
  )
}
