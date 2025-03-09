import { Container, DragHandle } from '@/styles/dashboard/CardGlobal'
import { AiOutlineDrag } from 'react-icons/ai'
import styled from 'styled-components'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ItemDeleteAlertDialog } from './ItemDeleteAlertDialog'
import { Layout } from 'react-grid-layout'
import { AccessibilityContainer } from './AccessibilityContainer'
import { GET_TABLE_DATA } from '@/graphql/Queries'
import { useLazyQuery } from '@apollo/client'
import { TableCardInfo } from '@/types/TableCardInfo'
import { Skeleton } from '@/components/ui/skeleton'

// Styled components
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

interface TableCardProps {
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
}

export const TableCard = ({ cardID, layout, setLayout, cols, breakPoint, editModeEnabled, handleDeleteItem, width, height, setHighlightedCardID, configuration }: TableCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const [highlight, setHighlight] = useState<'width' | 'height' | null>(null)
  const [chartConfig, setChartConfig] = useState<TableCardInfo>()
  const [fetchTableData] = useLazyQuery(GET_TABLE_DATA)

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

  const fetchData = async (sensors: { key: string; values: string }[], from: string, to: string, aggregateMinutes: number, operation: string) => {
    return fetchTableData({
      variables: {
        sensors: {
          sensors
        },
        request: {
          from: from,
          to: to,
          aggregateMinutes: aggregateMinutes,
          operation: operation
        }
      }
    })
  }

  useEffect(() => {
    if (highlight) setHighlightedCardID(cardID)
  }, [cardID, highlight])

  useEffect(() => {
    const fetchDataAndConfig = async () => {
      if (!configuration) return

      const config = JSON.parse(configuration.visualizationConfig) as TableCardInfo
      if (!config) return

      const sensors = config.rows.map((row) => ({
        key: row.instance.uid,
        values: row.parameter.denotation
      }))

      // Cleanup row.values
      config.rows.forEach((row) => {
        row.values = []
      })

      if (!sensors.length) return

      // Create array of promises for all operations
      let results
      try {
        // Execute all queries in parallel
        // results are returned in the same order as the queries
        results = await Promise.all(config.columns.map((column) => fetchData(sensors, new Date(Date.now() - 3600000).toISOString(), new Date().toISOString(), 1000, column.function)))

        const parsedData = results.map((result) => result.data.statisticsQuerySensorsWithFields)

        let columnIndex = 0
        parsedData.forEach((column) => {
          // Make use of the fact that the results are in the same order as the queries
          const functionName = config.columns[columnIndex].function
          columnIndex++
          // find each device in the column data for a specific function
          sensors.forEach((sensor) => {
            const instanceData = column.find((data: any) => data.deviceId === sensor.key)
            // find the row corresponding to the deviceID
            config.rows.forEach((row) => {
              if (row.instance.uid === sensor.key) {
                // parse the stringified data
                let parsedData = JSON.parse(instanceData.data)
                // console.log('PARSED DATA', parsedData[row.parameter.denotation]) // TODO: remove
                row.values?.push({
                  function: functionName,
                  value: parsedData[row.parameter.denotation]
                })
              }
            })
          })
        })

        setChartConfig(config)
        console.log('CONFIG', config)
      } catch (error) {
        console.error('Fetch error:', error)
      }
    }

    fetchDataAndConfig()
  }, [configuration])

  if (!chartConfig || !chartConfig.columns || !chartConfig.rows || !chartConfig.rows.values) {
    return <Skeleton className="w-full h-full" />
  }

  return (
    <Container key={cardID} className={`${cardID}`}>
      {editModeEnabled && (
        <DragHandle>
          <AiOutlineDrag className="drag-handle w-[40px] h-[40px] p-1 border-2 rounded-lg" />
        </DragHandle>
      )}
      {editModeEnabled && <ItemDeleteAlertDialog onSuccess={() => handleDeleteItem(cardID)} />}
      <div className="pl-4 pt-2 font-semibold">{chartConfig.title}</div>
      <ChartContainer ref={containerRef} $editModeEnabled={editModeEnabled}>
        <table className="w-full h-fit">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-left text-md">{chartConfig?.tableTitle!}</th>
              {chartConfig?.columns.map((column, index) => (
                <th key={index} className="text-center text-xs">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartConfig?.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="text-sm">{row.name}</td>
                {Array(row.values).length > 0 &&
                  row.values!.map((value, valueIndex) => (
                    <td key={valueIndex} className="text-sm text-center">
                      {parseFloat(value.value).toFixed(chartConfig.decimalPlaces ?? 2)}
                    </td>
                  ))}
              </tr>
            ))}
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
