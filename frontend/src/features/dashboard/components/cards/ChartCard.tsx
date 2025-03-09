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
import { ToolTip } from './tooltips/LineChartToolTip'
import { useLazyQuery } from '@apollo/client'
import { GET_TIME_SERIES_DATA } from '@/graphql/Queries'
import { Skeleton } from '@/components/ui/skeleton'

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
}

export const ChartCard = ({ cardID, layout, setLayout, cols, breakPoint, editModeEnabled, handleDeleteItem, width, height, setHighlightedCardID, configuration }: ChartCardProps) => {
  const [highlight, setHighlight] = useState<'width' | 'height' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { isDarkMode } = useDarkMode()
  const [data, setData] = useState([])
  const [chartConfig, setChartConfig] = useState<any>()

  const [getChartData, { error, data: chartData }] = useLazyQuery(GET_TIME_SERIES_DATA)

  const fetchData = () => {
    if (configuration) {
      getChartData({
        variables: {
          sensors: {
            sensors: [
              {
                key: configuration.instance.uid,
                values: [configuration.parameters[0].denotation]
              }
            ]
          },
          request: {
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            aggregateMinutes: '30',
            operation: 'last'
          }
        }
      })
    }
  }

  useEffect(() => {
    if (configuration) {
      setChartConfig(JSON.parse(configuration.visualizationConfig))
      console.log(JSON.parse(configuration.visualizationConfig))
      fetchData()
    }
  }, [configuration])

  useEffect(() => {
    if (chartData) {
      const processedData = chartData.statisticsQuerySensorsWithFields.map((item: any) => {
        const parsedData = JSON.parse(item.data)
        const { host, ...rest } = parsedData
        return {
          x: item.time,
          y: rest[configuration.parameters[0].denotation]
        }
      })
      console.log(processedData)
      setData(processedData)
    }
    console.log(error)
  }, [chartData, configuration])

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

  // calculate height and width from getboundingclientrect

  const lineData = [
    {
      id: 'data',
      data: data
    }
  ]

  // TODO: Alert
  if (!chartConfig || !data) return null

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
              data={lineData}
              margin={chartConfig.margin}
              xScale={chartConfig.xScale as any}
              yScale={chartConfig.yScale as any}
              animate={chartConfig.animate}
              yFormat={chartConfig.yFormat}
              axisBottom={chartConfig.axisBottom}
              axisLeft={chartConfig.axisLeft}
              pointSize={chartConfig.pointSize}
              pointColor={chartConfig.pointColor}
              pointBorderWidth={chartConfig.pointBorderWidth}
              pointBorderColor={chartConfig.pointBorderColor}
              pointLabel={chartConfig.pointLabel}
              pointLabelYOffset={chartConfig.pointLabelYOffset}
              enableTouchCrosshair={chartConfig.enableTouchCrosshair}
              useMesh={chartConfig.useMesh}
              enableGridX={chartConfig.enableGridX}
              enableGridY={chartConfig.enableGridY}
              tooltip={(pos: PointTooltipProps) => <ToolTip position={pos} containerRef={containerRef} xName={chartConfig.toolTip.x} yName={chartConfig.toolTip.y} />}
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
