import { Container, DeleteEditContainer, DragHandle } from '@/styles/dashboard/CardGlobal'
import { AiOutlineDrag } from 'react-icons/ai'
import { ResponsiveBullet } from '@nivo/bullet'
import styled from 'styled-components'
import { useEffect, useMemo, useState } from 'react'
import { ItemDeleteAlertDialog } from './components/ItemDeleteAlertDialog'
import { Layout } from 'react-grid-layout'
import { AccessibilityContainer } from './components/AccessibilityContainer'
import { useDarkMode } from '@/context/DarkModeContext'
import { lightTheme, darkTheme } from './components/ChartThemes'
import { Skeleton } from '@/components/ui/skeleton'
import { bulletChartBuilderSchema, BulletCardConfig } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { toast } from 'sonner'
import { CardEditDialog } from '../editors/CardEditDialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BuilderResult } from '@/types/dashboard/GridItem'
import {
  SdInstancesWithTypeAndSnapshotQuery,
  StatisticsOperation,
  useStatisticsQuerySensorsWithFieldsLazyQuery
} from '@/generated/graphql'
import { BulletChartToolTip } from './tooltips/BulletChartToolTIp'
import { useDeviceDetail } from '@/context/DeviceDetailContext'

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
  handleSaveEdit: (config: BuilderResult<BulletCardConfig>) => void
  instances: SdInstancesWithTypeAndSnapshotQuery['sdInstances']
}

export const BulletCard = ({
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
  handleSaveEdit,
  instances
}: BulletCardProps) => {
  const { isDarkMode } = useDarkMode()
  const [chartConfig, setChartConfig] = useState<BulletCardConfig>()
  const [highlight, setHighlight] = useState<'width' | 'height' | null>(null)
  const [data, setData] = useState<any[]>([])
  const [getChartData] = useStatisticsQuerySensorsWithFieldsLazyQuery()
  const [error, setError] = useState<string | null>(null)
  const { setDetailsSelectedDevice } = useDeviceDetail()

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

      const results = await Promise.allSettled(
        rows.map(async (row) => {
          return getChartData({
            variables: {
              sensors: {
                sensors: [
                  {
                    key: row.instance.uid,
                    values: [row.parameter.denotation]
                  }
                ]
              },
              request: {
                from: new Date(Date.now() - Number(row.config.timeFrame) * 60 * 60 * 1000).toISOString(),
                aggregateMinutes: Number(row.config.timeFrame) * 60 * 1000,
                operation: row.config.function as StatisticsOperation
              }
            }
          })
        })
      )

      const parsedData = results.map((result) => {
        if (result.status === 'fulfilled' && result.value.data?.statisticsQuerySensorsWithFields.length! > 0) {
          return result.value.data?.statisticsQuerySensorsWithFields
        } else {
          const sensor = result.status === 'fulfilled' ? result.value.variables?.sensors?.sensors[0]! : null
          console.error('Failed to fetch data for sensor', sensor)
          console.error('Fetch error:', result.status === 'rejected' ? result.reason : 'Empty data')
          return null
        }
      })

      const newData = parsedData.map((parsed, index) => {
        if (!parsed) return null
        const row = rows[index]
        const parsedValue = parsed[0]?.data ? JSON.parse(parsed[0].data) : null
        const value = parsedValue ? parsedValue[row.parameter.denotation] : undefined
        if (value === undefined) {
          return null
        }
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
    if (chartConfig) {
      fetchData()
    }
  }, [chartConfig])

  // calculate height and width from getboundingclientrect

  useEffect(() => {
    if (configuration) {
      // Safe parse does not throw an error and we can leverage its success property
      console.log('Configuration', configuration)
      const parsedConfig = bulletChartBuilderSchema.safeParse(configuration.visualizationConfig)
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

  function handleOnClick(instanceUID: string, parameter: string) {
    setDetailsSelectedDevice({ uid: instanceUID, parameter: parameter })
  }

  if (!chartConfig || !data || beingResized || error)
    return (
      <>
        <Skeleton className="h-full w-full" />
        {error && (
          <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center rounded-lg bg-destructive text-primary">
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
          <CardEditDialog config={chartConfig} onSave={handleSaveEdit} visualizationType="bullet" />
          <ItemDeleteAlertDialog onSuccess={() => handleDeleteItem(cardID)} />
        </DeleteEditContainer>
      )}
      {chartConfig.cardTitle ? <span className="pl-2 pt-2 font-semibold">{chartConfig.cardTitle}</span> : null}
      {chartConfig.rows?.map((row, index) => {
        const instanceName = instances.find((instance) => instance.uid === row.instance.uid)?.userIdentifier
        if (!data[index])
          return (
            // Return a skeleton if data is not available
            <BulletContainer
              key={index}
              $editModeEnabled={editModeEnabled}
              onClick={() => handleOnClick(row.instance.uid, row.parameter.denotation)}
            >
              <Skeleton className="h-full w-full p-2" disableAnimation>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex w-full flex-col items-center justify-center">
                        <span className="w-full truncate text-center font-bold text-destructive">
                          Data not available
                        </span>
                        <span className="w-full truncate text-center text-xs text-gray-500">
                          Device: {instanceName}
                        </span>
                        <span className="w-full truncate text-center text-xs text-gray-500">
                          Parameter: {row.parameter.denotation}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex max-w-28 flex-col">
                        <span className="font-semibold text-destructive">No data available</span>
                        <span className="break-words text-xs">Device: {instanceName}</span>
                        <span className="text-xs">Parameter: {row.parameter.denotation}</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Skeleton>
            </BulletContainer>
          )
        return (
          <BulletContainer key={index} $editModeEnabled={editModeEnabled}>
            <ResponsiveBullet
              data={[data[index]]}
              margin={row.config.margin}
              titleOffsetX={row.config.titleOffsetX}
              measureSize={row.config.measureSize}
              minValue={row.config.minValue || 'auto'}
              maxValue={row.config.maxValue || 'auto'}
              rangeColors={
                row.config.colorScheme === 'greys'
                  ? // The nivo's grey color scheme is not suitable as the colors are in reversed order
                    ['#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3']
                  : 'seq:cool'
              }
              measureColors={row.config.colorScheme === 'greys' ? ['pink'] : 'seq:red_purple'}
              theme={isDarkMode ? darkTheme : lightTheme}
              // TODO: Mobile devices problem
              onMarkerClick={() => {
                handleOnClick(row.instance.uid, row.parameter.denotation)
              }}
              onMeasureClick={() => {
                handleOnClick(row.instance.uid, row.parameter.denotation)
              }}
              onRangeClick={() => {
                handleOnClick(row.instance.uid, row.parameter.denotation)
              }}
              tooltip={() => {
                const instanceName = instances.find((instance) => instance.uid === row.instance.uid)?.userIdentifier
                return (
                  <BulletChartToolTip
                    instanceName={instanceName}
                    parameterName={row.parameter.denotation}
                    currentValue={data[index].measures[0]}
                    targetValues={row.config.markers}
                  />
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
