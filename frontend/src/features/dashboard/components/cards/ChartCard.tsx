import { Container, DragHandle } from '@/styles/dashboard/CardGlobal'
import { AiOutlineDrag } from 'react-icons/ai'
import { ResponsiveLine, PointTooltipProps } from '@nivo/line'
import styled from 'styled-components'
// import { Layout } from '@/types/Layout';
import { useEffect, useMemo, useRef, useState } from 'react'
import { ItemDeleteAlertDialog } from './ItemDeleteAlertDialog'
import { Layout } from 'react-grid-layout'
import { AccessibilityContainer } from './AccessibilityContainer'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from './ChartThemes'
import { ChartToolTip } from './tooltips/LineChartToolTip'
import { useLazyQuery } from '@apollo/client'
import { GET_TIME_SERIES_DATA } from '@/graphql/Queries'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ChartCardConfig } from '@/schemas/dashboard/LineChartBuilderSchema'
import type { LineChartConfig } from '@/types/LineChartConfig'

// Styled components
export const ChartContainer = styled.div<{ $editModeEnabled?: boolean }>`
  position: relative;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-grow: 1;
  overflow-y: hidden;
  overflow-x: hidden;
  opacity: ${(props) => (props.$editModeEnabled ? 0.25 : 1)};
  transition: opacity 0.3s;
  border-radius: 12px;
`

type Config = {
  values: ChartCardConfig
  chartConfig: LineChartConfig
}

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
}

export const ChartCard = ({ cardID, layout, setLayout, cols, breakPoint, editModeEnabled, handleDeleteItem, width, height, setHighlightedCardID, configuration }: ChartCardProps) => {
  const [highlight, setHighlight] = useState<'width' | 'height' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { isDarkMode } = useDarkMode()
  const [data, setData] = useState<any[]>([])
  const [cardConfig, setCardConfig] = useState<ChartCardConfig>()
  const [chartConfig, setChartConfig] = useState<LineChartConfig>()

  const [getChartData, { data: fetchedChartData }] = useLazyQuery(GET_TIME_SERIES_DATA)

  const fetchData = () => {
    console.log('Chart config', cardConfig)
    if (cardConfig) {
      const instances = cardConfig?.instances
      if (!instances) return
      console.log('Fetching data')
      const sensors = instances.map((instance: { uid: string; parameters: { denotation: string }[] }) => ({
        key: instance.uid,
        values: instance.parameters ? instance.parameters.map((param) => param.denotation) : []
      }))

      const request = {
        from: new Date(Date.now() - Number(cardConfig.timeFrame) * 60 * 1000).toISOString(),
        aggregateMinutes: cardConfig.aggregateMinutes,
        operation: 'last'
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
      console.log('Configuration', configuration.visualizationConfig.config)
      const globalConfig: Config = configuration.visualizationConfig.config
      console.log('Global config', globalConfig)
      // console.log('Global config', globalConfig)
      setCardConfig(globalConfig.values)
      setChartConfig(globalConfig.chartConfig)
      // console.log(JSON.parse(configuration.visualizationConfig))
    }
  }, [configuration])

  useEffect(() => {
    if (cardConfig) {
      fetchData()
    }
  }, [cardConfig])

  useEffect(() => {
    if (!cardConfig) return
    if (!fetchedChartData) return
    const instances = cardConfig?.instances

    let result: any[] = []

    instances.forEach((instance: { uid: string; parameters: { denotation: string }[] }) => {
      const sensorDataArray = fetchedChartData.statisticsQuerySensorsWithFields.filter((item: any) => item.deviceId === instance.uid)
      instance.parameters.forEach((param) => {
        const paramData = {
          id: param.denotation + '-' + instance.uid,
          data: sensorDataArray.map((sensorData: any) => {
            const parsedData = JSON.parse(sensorData.data)
            return {
              x: sensorData.time,
              y: parsedData[param.denotation]
            }
          })
        }
        if (paramData.data.length === 0) {
          toast.error('One or more of the selected parameters have no data available for the selected time frame.')
          return
        }
        result.push(paramData)
      })
    })

    setData(result)
  }, [fetchedChartData])

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
  if (!cardConfig || !chartConfig || !data) return <Skeleton className="w-full h-full" />

  return (
    <Container key={cardID} className={`${cardID}`}>
      {editModeEnabled && (
        <DragHandle>
          <AiOutlineDrag className="drag-handle w-[40px] h-[40px] p-1 rounded-lg border-2" />
        </DragHandle>
      )}
      {editModeEnabled && <ItemDeleteAlertDialog onSuccess={() => handleDeleteItem(cardID)} />}
      {data && data.length > 0 ? (
        <>
          <div className="pl-4 pt-2 font-semibold">{chartConfig.cardTitle}</div>
          <ChartContainer ref={containerRef} $editModeEnabled={editModeEnabled}>
            <ResponsiveLine
              data={data}
              margin={chartConfig.margin}
              xScale={chartConfig.xScale as any}
              yScale={chartConfig.yScale as any}
              animate={chartConfig.animate}
              yFormat={chartConfig.yFormat}
              axisBottom={chartConfig.axisBottom}
              axisLeft={chartConfig.axisLeft}
              pointSize={chartConfig.pointSize}
              pointColor={isDarkMode ? '#ffffff' : '#000000'}
              pointBorderWidth={0}
              colors={isDarkMode ? { scheme: 'category10' } : { scheme: 'pastel1' }}
              useMesh={true}
              enableGridX={chartConfig.enableGridX}
              enableGridY={chartConfig.enableGridY}
              tooltip={(pos: PointTooltipProps) => <ChartToolTip position={pos} containerRef={containerRef} xName={chartConfig.toolTip.x} yName={chartConfig.toolTip.y} />}
              theme={isDarkMode ? darkTheme : lightTheme}
            />
          </ChartContainer>
        </>
      ) : (
        <Skeleton className="w-full h-full" />
      )}
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
            <div style={{ width: `${width}px` }} className={`h-full absolute top-0 left-full ${highlight ? 'opacity-50' : 'opacity-0'} transition-opacity duration-200 bg-green-400 rounded-r-lg`} />
          )}
          {item?.w !== 1 && item?.w !== item?.minW && (
            <div style={{ width: `${width}px` }} className={`h-full absolute top-0 right-0  ${highlight ? 'opacity-50' : 'opacity-0'} transition-opacity duration-200 bg-red-400 rounded-r-lg`} />
          )}
        </>
      )}
      {highlight === 'height' && (
        <>
          {item?.h !== item?.maxH && (
            <div style={{ height: `${height}px` }} className={`w-full absolute top-full left-0 ${highlight ? 'opacity-50' : 'opacity-0'} transition-opacity duration-200 bg-green-400 rounded-b-lg`} />
          )}
          {item?.h !== item?.minH && item?.h !== 1 && (
            <div style={{ height: `${height}px` }} className={`w-full absolute bottom-0 left-0 ${highlight ? 'opacity-50' : 'opacity-0'} transition-opacity duration-200 bg-red-400 rounded-b-lg`} />
          )}
        </>
      )}
    </Container>
  )
}
