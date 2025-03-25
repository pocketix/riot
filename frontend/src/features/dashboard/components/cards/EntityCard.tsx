import { Container, DeleteEditContainer, DragHandle } from '@/styles/dashboard/CardGlobal'
import { AiOutlineDrag } from 'react-icons/ai'
import styled from 'styled-components'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ItemDeleteAlertDialog } from './components/ItemDeleteAlertDialog'
import { Layout } from 'react-grid-layout'
import { AccessibilityContainer } from './components/AccessibilityContainer'
import { entityCardSchema, EntityCardConfig } from '@/schemas/dashboard/EntityCardBuilderSchema'
import { Skeleton } from '@/components/ui/skeleton'
import { ResponsiveLine } from '@nivo/line'
import { Switch } from '@/components/ui/switch'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from './components/ChartThemes'
import { toast } from 'sonner'
import { CardEditDialog } from '../editors/CardEditDialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BuilderResult } from '@/types/dashboard/GridItem'
import { StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'

export const ChartContainer = styled.div<{ $editModeEnabled?: boolean }>`
  position: relative;
  margin: 0;
  padding: 12px;
  padding-top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-grow: 1;
  overflow-y: hidden;
  overflow-x: hidden;

  opacity: ${(props) => (props.$editModeEnabled ? 0.25 : 1)};
  transition: opacity 0.3s;
`

interface EntityCardProps {
  cardID: string
  title: string
  layout: Layout[]
  setLayout: (layout: Layout[]) => void
  breakPoint: string
  editModeEnabled: boolean
  cols: { lg: number; md: number; sm: number; xs: number; xxs: number }
  handleDeleteItem: (id: string) => void
  height: number
  width: number
  setHighlightedCardID: (id: string) => void

  // Data
  configuration: any
  handleSaveEdit: (config: BuilderResult<EntityCardConfig>) => void
}

interface RowData {
  sparklineData?: { data: { x: string; y: number }[] }
  value?: string | number
}

export const EntityCard = ({
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
  handleSaveEdit
}: EntityCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isDarkMode } = useDarkMode()

  const [highlight, setHighlight] = useState<'width' | 'height' | null>(null)
  const [data, setData] = useState<RowData[]>([])
  const [chartConfig, setChartConfig] = useState<EntityCardConfig>()
  const [fetchData] = useStatisticsQuerySensorsWithFieldsLazyQuery()

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

  const getData = async () => {
    console.log('Chart config', chartConfig)
    if (chartConfig) {
      const rows = chartConfig?.rows
      if (!rows) return
      console.log('Fetching data')
      const rowsToFetch = rows.map((row) => ({
        key: row.instance.uid,
        values: row.parameter.denotation,
        timeFrame: row.visualization === 'sparkline' ? Number(row.timeFrame) : 1440,
        aggregatedMinutes: row.visualization === 'sparkline' ? Number(row.timeFrame) / 32 : Number(row.timeFrame)
      }))

      console.log('Rows to fetch', rowsToFetch)

      const results = await Promise.allSettled(
        rowsToFetch.map((row) => {
          return fetchData({
            variables: {
              sensors: {
                sensors: [
                  {
                    key: row.key,
                    values: [row.values]
                  }
                ]
              },
              request: {
                from: new Date(Date.now() - row.timeFrame * 60 * 1000).toISOString(),
                aggregateMinutes: Math.ceil(row.aggregatedMinutes),
                operation: StatisticsOperation.Last
              }
            }
          })
        })
      )

      const parsedData = results.map((result, index) => {
        if (result.status === 'fulfilled' && result.value.data?.statisticsQuerySensorsWithFields.length! > 0) {
          return result.value.data?.statisticsQuerySensorsWithFields
        } else {
          console.error(
            `Error fetching data for row ${index}:`,
            result.status === 'rejected' ? result.reason : 'Empty data'
          )
          return null
        }
      })

      const rowValues: RowData[] = []
      chartConfig.rows.forEach((row, index) => {
        const data = parsedData[index]
        console.log('Data', data)
        if (row.visualization === 'sparkline' && data) {
          const sparklineData = data.map((item: any) => {
            const value = JSON.parse(item.data)
            return {
              x: item.time,
              y: value[row.parameter.denotation]
            }
          })
          rowValues.push({ sparklineData: { data: sparklineData } })
        } else if (row.visualization === 'immediate' && data) {
          const value = JSON.parse(data[0].data)
          rowValues.push({ value: value[row.parameter.denotation] })
        } else {
          rowValues.push({ value: undefined })
        }
      })
      setData(rowValues)
      console.log('Result', rowValues)
    }
  }

  useEffect(() => {
    if (configuration) {
      const parsedConfig = entityCardSchema.safeParse(configuration.visualizationConfig)
      if (parsedConfig.success) {
        console.log('Parsed config', parsedConfig.data)
        setChartConfig(parsedConfig.data)
      } else {
        toast.error('Failed to parse configuration')
      }
    }
  }, [configuration])

  useEffect(() => {
    if (chartConfig) {
      getData()
    }
  }, [chartConfig])

  useEffect(() => {
    if (highlight) setHighlightedCardID(cardID)
  }, [cardID, highlight])

  if (!chartConfig || !chartConfig.rows) {
    return <Skeleton className="h-full w-full" />
  }

  return (
    <Container key={cardID} className={`${cardID}`}>
      {editModeEnabled && (
        <DragHandle>
          <AiOutlineDrag className="drag-handle h-[40px] w-[40px] rounded-lg border-2 p-1" />
        </DragHandle>
      )}
      {editModeEnabled && (
        <DeleteEditContainer>
          <CardEditDialog config={chartConfig} onSave={handleSaveEdit} visualizationType="entitycard" />
          <ItemDeleteAlertDialog onSuccess={() => handleDeleteItem(cardID)} />
        </DeleteEditContainer>
      )}
      <div className="pl-2 pt-2 font-semibold">{chartConfig.title}</div>
      <ChartContainer ref={containerRef} $editModeEnabled={editModeEnabled}>
        <table className="h-fit w-full">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-md text-left">Name</th>
            </tr>
          </thead>
          <tbody>
            {chartConfig.rows.map((row, rowIndex) => {
              if (
                !data[rowIndex] ||
                (row.visualization === 'sparkline' && !data[rowIndex].sparklineData) ||
                (row.visualization !== 'sparkline' && !data[rowIndex].value)
              )
                return (
                  <tr key={rowIndex}>
                    <td className="text-sm">{row.name}</td>
                    <td className="h-[24px] w-[75px] text-center text-sm">
                      <Skeleton className="h-full w-full" disableAnimation>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate text-xs font-semibold text-destructive">Unavailable</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="flex max-w-28 flex-col">
                                <span className="font-semibold text-destructive">No data available</span>
                                <span className="break-words text-xs">Device: {row.instance.uid}</span>
                                <span className="break-words text-xs">Parameter: {row.parameter.denotation}</span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Skeleton>
                    </td>
                  </tr>
                )
              return (
                <tr key={rowIndex}>
                  <td className="text-sm">{row.name}</td>
                  {row.visualization === 'sparkline' && (
                    <td className="h-[24px] w-[75px] text-center text-sm">
                      <ResponsiveLine
                        data={[
                          {
                            id: row.instance.uid + '-' + row.parameter.denotation,
                            data: data[rowIndex].sparklineData!.data
                          }
                        ]}
                        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                        xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%SZ' }}
                        xFormat="time:%Y-%m-%dT%H:%M:%SZ"
                        yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
                        animate={false}
                        pointSize={0}
                        axisBottom={null}
                        axisLeft={null}
                        curve="cardinal"
                        lineWidth={4}
                        enableGridX={false}
                        enableGridY={false}
                        useMesh={false}
                        theme={isDarkMode ? darkTheme : lightTheme}
                      />
                    </td>
                  )}
                  {row.visualization === 'immediate' && <td className="text-center text-sm">{data[rowIndex].value}</td>}
                  {row.visualization === 'switch' && (
                    <td className="text-center text-sm">
                      <Switch checked={data[rowIndex].value === 'on'} />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
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
