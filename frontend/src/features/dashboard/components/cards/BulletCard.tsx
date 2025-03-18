import { Container, DeleteEditContainer, DragHandle } from '@/styles/dashboard/CardGlobal'
import { AiOutlineDrag } from 'react-icons/ai'
import { ResponsiveBullet } from '@nivo/bullet'
import styled from 'styled-components'
// import { Layout } from '@/types/Layout';
import { useEffect, useMemo, useState } from 'react'
import { ItemDeleteAlertDialog } from './ItemDeleteAlertDialog'
import { Layout } from 'react-grid-layout'
import { AccessibilityContainer } from './AccessibilityContainer'
import { useDarkMode } from '@/context/DarkModeContext'
import { lightTheme, darkTheme } from './ChartThemes'
import { ToolTipContainer } from './ChartGlobals'
import { Skeleton } from '@/components/ui/skeleton'
import { useLazyQuery } from '@apollo/client'
import { GET_TIME_SERIES_DATA } from '@/graphql/Queries'
import { bulletChartBuilderSchema, BulletCardConfig } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { toast } from 'sonner'
import { CardEditDialog } from '../editor/CardEditDialog'

// Styled components
export const BulletContainer = styled.div<{ $editModeEnabled?: boolean }>`
  position: relative;
  margin: 0;
  padding: 0 8px 0 8px;
  width: 100%;
  height: 100%;
  max-height: 75px;
  display: flex;
  opacity: ${(props) => (props.$editModeEnabled ? 0.25 : 1)};
  transition: opacity 0.3s;
  border-radius: 12px;
`

interface BulletCardProps {
  cardID: string
  title: string
  layout: Layout[]
  breakPoint: string
  editModeEnabled: boolean
  cols: { lg: number; md: number; sm: number; xs: number; xxs: number }
  height: number
  width: number
  setLayout: (layout: Layout[]) => void
  handleDeleteItem: (id: string) => void
  setHighlightedCardID: (id: string) => void
  beingResized: boolean

  configuration: any
}

export const BulletCard = ({ cardID, layout, setLayout, cols, breakPoint, editModeEnabled, handleDeleteItem, width, height, setHighlightedCardID, configuration, beingResized }: BulletCardProps) => {
  const { isDarkMode } = useDarkMode()
  const [chartConfig, setChartConfig] = useState<BulletCardConfig>()
  const [highlight, setHighlight] = useState<'width' | 'height' | null>(null)
  const [data, setData] = useState<any[]>([])
  const [getChartData] = useLazyQuery(GET_TIME_SERIES_DATA)

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

  const fetchData = async () => {
    if (chartConfig) {
      const rows = chartConfig.rows
      if (!rows) return

      console.log('Fetching data')
      console.log('CONFIGS', rows)

      const results = await Promise.all(
        rows.map(async (row) => {
          return getChartData({
            variables: {
              sensors: {
                sensors: [
                  {
                    key: row.instance.uid,
                    values: row.parameter.denotation
                  }
                ]
              },
              request: {
                from: new Date(Date.now() - Number(row.config.timeFrame) * 60 * 1000).toISOString(),
                aggregateMinutes: Number(row.config.timeFrame) * 1000,
                operation: row.config.function
              }
            }
          })
        })
      )

      const parsedData = results
        .map((result) => {
          if (!result || !result.data) return null
          return result.data.statisticsQuerySensorsWithFields
        })
        .filter(Boolean)

      console.log('PARSED DATA', parsedData)
      const newData = parsedData.map((parsed, index) => {
        const row = rows[index]
        const value = JSON.parse(parsed[0].data)[row.parameter.denotation]
        return {
          id: row.config.name,
          measures: [value],
          markers: row.config.markers,
          ranges: row.config.ranges ? row.config.ranges.flatMap((range) => [range.min, range.max]) : [0, 0]
        }
      })
      setData(newData)
    }
  }

  useEffect(() => {
    if (data) {
      console.log('Data', data)
    }
  }, [data])

  useEffect(() => {
    if (chartConfig) {
      console.log('Chart config', chartConfig)
      fetchData()
    }
  }, [chartConfig])

  // calculate height and width from getboundingclientrect

  useEffect(() => {
    if (configuration) {
      // Safe parse does not throw an error and we can leverage its success property
      const parsedConfig = bulletChartBuilderSchema.safeParse(configuration.visualizationConfig.config)
      if (parsedConfig.success) {
        console.log('Parsed config', parsedConfig.data)
        setChartConfig(parsedConfig.data)
      } else {
        toast.error('Failed to parse configuration')
      }
    }
  }, [configuration])

  if (!chartConfig || !data || beingResized) return <Skeleton className="w-full h-full" />

  return (
    <Container key={cardID} className={`${cardID}`}>
      {editModeEnabled && (
        <DragHandle>
          <AiOutlineDrag className="drag-handle w-[40px] h-[40px] p-1 rounded-lg border-2" />
        </DragHandle>
      )}
      {editModeEnabled && (
        <DeleteEditContainer>
          <CardEditDialog bulletCardConfig={chartConfig} />
          <ItemDeleteAlertDialog onSuccess={() => handleDeleteItem(cardID)} />
        </DeleteEditContainer>
      )}
      {chartConfig.cardTitle ? <div className="pl-4 pt-2 font-semibold">{chartConfig.cardTitle}</div> : null}
      {chartConfig.rows?.map((row, index) => {
        console.log('ROW', row)
        console.log('DATA AT INDEX', data[index])
        if (!data[index]) return null
        return (
          <BulletContainer key={index} $editModeEnabled={editModeEnabled}>
            <ResponsiveBullet
              data={[data[index]]}
              margin={row.config.margin}
              titleOffsetX={row.config.titleOffsetX}
              measureSize={row.config.measureSize}
              minValue={row.config.minValue || 'auto'}
              maxValue={row.config.maxValue || 'auto'}
              rangeColors={row.config.colorScheme === 'greys' ? ['#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3'] : 'seq:cool'}
              measureColors={row.config.colorScheme === 'greys' ? ['pink'] : 'seq:red_purple'}
              theme={isDarkMode ? darkTheme : lightTheme}
              tooltip={() => {
                return (
                  <ToolTipContainer $offsetHorizontal={0} $offsetVertical={0} $isDarkMode={isDarkMode}>
                    <div className="flex flex-col">
                      <div>
                        <span>Value: </span>
                        <span className="font-bold">{data[index].measures}</span>
                      </div>
                      <div>
                        <span>Target: </span>
                        <span className="font-bold">{data[index].markers}</span>
                      </div>
                    </div>
                  </ToolTipContainer>
                )
              }}
            />
          </BulletContainer>
        )
      })}
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
