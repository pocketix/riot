import { Container, DeleteEditContainer, DragHandle } from '@/styles/dashboard/CardGlobal'
import { AiOutlineDrag } from 'react-icons/ai'
import styled from 'styled-components'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ItemDeleteAlertDialog } from './components/ItemDeleteAlertDialog'
import { Layout } from 'react-grid-layout'
import { AccessibilityContainer } from './components/AccessibilityContainer'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCardConfig, tableCardSchema } from '@/schemas/dashboard/TableBuilderSchema'
import { CardEditDialog } from '../editors/CardEditDialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BuilderResult } from '@/types/GridItem'
import { toast } from 'sonner'
import { SensorField, StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'

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
  beingResized: boolean
  handleSaveEdit: (config: BuilderResult<TableCardConfig>) => void

  // Data
  configuration: any
}

export const TableCard = ({
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
}: TableCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const [highlight, setHighlight] = useState<'width' | 'height' | null>(null)
  const [tableConfig, setTableConfig] = useState<TableCardConfig>()
  const [tableData, setTableData] = useState<any[]>([])
  const [fetchTableData] = useStatisticsQuerySensorsWithFieldsLazyQuery()

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

  const fetchData = async (sensors: SensorField[], from: string, aggregateMinutes: number, operation: string) => {
    return fetchTableData({
      variables: {
        sensors: {
          sensors
        },
        request: {
          from: from,
          aggregateMinutes: aggregateMinutes,
          operation: operation as StatisticsOperation
        }
      }
    })
  }

  useEffect(() => {
    if (highlight) setHighlightedCardID(cardID)
  }, [cardID, highlight])

  useEffect(() => {
    if (configuration) {
      const parsedConfig = tableCardSchema.safeParse(configuration.visualizationConfig)
      if (parsedConfig.success) {
        setTableConfig(parsedConfig.data)
      } else {
        toast.error('Failed to parse configuration')
        console.error('Failed to parse configuration')
      }
    }
  }, [configuration])

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

  useEffect(() => {
    const fetchDataAndPopulate = async () => {
      if (!tableConfig) return

      const sensors : SensorField[] = tableConfig.rows.map((row) => ({
        key: row.instance.uid,
        values: [row.parameter.denotation]
      }))

      const combinedSensors = combineSensors(sensors)

      console.log('SENSORS', combinedSensors)

      if (!combinedSensors.length) return

      // Create array of promises for all operations
      let results
      try {
        // Execute all queries in parallel
        // results are returned in the same order as the queries
        results = await Promise.allSettled(
          tableConfig.columns.map((column) =>
            fetchData(combinedSensors, new Date(Date.now() - Number(tableConfig.timeFrame) * 60 * 1000).toISOString(), Number(tableConfig.timeFrame) * 1000, column.function)
          )
        )

        console.log('RESULTS', results)
        const parsedData = results.map((result) => {
          if (result.status === 'fulfilled' && result.value.data?.statisticsQuerySensorsWithFields.length! > 0) {
            return result.value.data?.statisticsQuerySensorsWithFields
          } else {
            console.error('Fetch error:', result.status === 'rejected' ? result.reason : 'Empty data')
            return null
          }
        })

        const updatedRows = tableConfig.rows.map((row) => {
          let columnIndex = 0
          const rowValues: any = []
          console.log('Parsed data', parsedData)
          parsedData.forEach((column) => {
            // Make use of the fact that the results are in the same order as the queries
            const functionName = tableConfig.columns[columnIndex++]?.function!
            console.log('Function name', functionName, 'Column index', columnIndex)
            console.log('Column index', columnIndex)
            // find each device in the column data for a specific function
            // TODO: Finding by deviceId may not be sufficient ! There can be multiple rows for the same device
            const instanceData = column?.find((data: any) => data.deviceId === row.instance.uid)
            if (instanceData) {
              // parse the stringified data
              let parsedData = JSON.parse(instanceData.data)
              rowValues.push({
                function: functionName,
                value: parsedData[row.parameter.denotation]
              })
            } else {
              rowValues.push({
                function: functionName,
                value: 'NaN'
              })
            }
          })
          return { ...row, values: rowValues }
        })

        console.log('Table data', updatedRows)

        setTableData(updatedRows)
        console.log('CONFIG', tableConfig)
      } catch (error) {
        console.error('Fetch error:', error)
      }
    }

    fetchDataAndPopulate()
  }, [tableConfig])

  if (!tableConfig || !tableConfig.columns || !tableData || beingResized) {
    return <Skeleton className="w-full h-full" />
  }

  return (
    <Container key={cardID} className={`${cardID}`}>
      {editModeEnabled && (
        <DragHandle>
          <AiOutlineDrag className="drag-handle w-[40px] h-[40px] p-1 border-2 rounded-lg" />
        </DragHandle>
      )}
      {editModeEnabled && (
        <DeleteEditContainer>
          <CardEditDialog config={tableConfig} onSave={handleSaveEdit} visualizationType="table" />
          <ItemDeleteAlertDialog onSuccess={() => handleDeleteItem(cardID)} />
        </DeleteEditContainer>
      )}
      <div className="pl-2 pt-2 font-semibold">{tableConfig.title}</div>
      <ChartContainer ref={containerRef} $editModeEnabled={editModeEnabled}>
        <table className="w-full h-fit">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-left text-md">{tableConfig?.tableTitle!}</th>
              {tableConfig?.columns.map((column, index) => (
                <th key={index} className="text-center text-xs">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData?.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="text-sm">{row.name}</td>
                {row.values?.map((data: { function: string; value?: number }, valueIndex: number) => {
                  if (!data.value || isNaN(data.value))
                    return (
                      <td key={valueIndex} className="text-sm text-center">
                        <Skeleton className="w-1/2 h-full m-auto" disableAnimation>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-destructive truncate font-semibold text-xs w-10">Unavailable</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="flex flex-col max-w-28">
                                  <span className="text-destructive font-semibold">No data available</span>
                                  <span className="text-xs break-words">Device: {row.instance.uid}</span>
                                  <span className="text-xs break-words">Parameter: {row.parameter.denotation}</span>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Skeleton>
                      </td>
                    )
                  return (
                    <td key={valueIndex} className="text-sm text-center">
                      {parseFloat(data?.value!.toFixed(tableConfig.decimalPlaces ?? 2))}
                    </td>
                  )
                })}
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
