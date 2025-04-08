import { Container, DeleteEditContainer, DragHandle } from '@/styles/dashboard/CardGlobal'
import { AiOutlineDrag } from 'react-icons/ai'
import styled from 'styled-components'
import { useEffect, useMemo, useState } from 'react'
import { ItemDeleteAlertDialog } from './components/ItemDeleteAlertDialog'
import { Layout } from 'react-grid-layout'
import { AccessibilityContainer } from './components/AccessibilityContainer'
import { Skeleton } from '@/components/ui/skeleton'
import { bulletChartBuilderSchema, BulletCardConfig } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { toast } from 'sonner'
import { CardEditDialog } from '../editors/CardEditDialog'
import { BuilderResult } from '@/types/dashboard/GridItem'
import { StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { BulletRow } from './components/BulletRow'

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
  cols: { lg: number; md: number; sm: number; xs: number; xxs: number }
  height: number
  width: number
  setLayout: (layout: Layout[]) => void
  handleDeleteItem: (id: string) => void
  setHighlightedCardID: (id: string) => void
  editModeEnabled: boolean
  beingResized: boolean

  configuration: any
  handleSaveEdit: (config: BuilderResult<BulletCardConfig>) => void
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
  handleSaveEdit
}: BulletCardProps) => {
  const [chartConfig, setChartConfig] = useState<BulletCardConfig>()
  const [highlight, setHighlight] = useState<'width' | 'height' | null>(null)
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Poll interval based on the smallest time frame in the card config
  const minimumTimeframe = useMemo(() => {
    const rows = chartConfig?.rows
    if (!rows) return 0

    const timeframes = rows.map((row) => Number(row.config.timeFrame))
    const minTimeframe = Math.min(...timeframes)

    return minTimeframe
  }, [chartConfig])

  const [getChartData] = useStatisticsQuerySensorsWithFieldsLazyQuery({
    pollInterval: minimumTimeframe > 0 ? minimumTimeframe * 60 * 60 * 1000 : 0
  })

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

      // "last" function rows will use real-time data
      const aggregationRows = rows.filter((row) => row.config.function !== 'last')

      if (aggregationRows.length === 0) {
        setData([])
        return
      }

      const results = await Promise.allSettled(
        aggregationRows.map(async (row) => {
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

      const newData = aggregationRows.map((row, index) => {
        const parsed = parsedData[index]
        if (!parsed) return null

        const parsedValue = parsed[0]?.data ? JSON.parse(parsed[0].data) : null
        const value = parsedValue ? parsedValue[row.parameter.denotation] : undefined

        if (value === undefined) {
          return null
        }

        return {
          rowIndex: rows.findIndex((r) => r === row), // Store the original row index
          data: {
            id: row.config.name,
            measures: [value],
            markers: row.config.markers,
            ranges: row.config.ranges ? row.config.ranges.flatMap((range) => [range.min, range.max]) : [0, 0]
          }
        }
      })

      setData(newData.filter(Boolean))
    }
  }

  useEffect(() => {
    if (chartConfig) {
      fetchData()
    }
  }, [chartConfig])

  useEffect(() => {
    if (configuration) {
      // Safe parse does not throw an error and we can leverage its success property
      const parsedConfig = bulletChartBuilderSchema.safeParse(configuration.visualizationConfig)
      if (parsedConfig.success) {
        setChartConfig(parsedConfig.data)
      } else {
        setError('Failed to parse configuration')
        console.error('Failed to parse configuration', parsedConfig.error)
      }
    }
  }, [configuration])

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
        if (row.config.function === 'last') {
          return <BulletRow key={index} row={row} editModeEnabled={editModeEnabled} />
        }

        const rowData = data.find((d) => d.rowIndex === index)?.data
        return <BulletRow key={index} row={row} aggregatedData={rowData} editModeEnabled={editModeEnabled} />
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
