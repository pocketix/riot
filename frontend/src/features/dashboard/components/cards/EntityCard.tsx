import { Container, DragHandle } from '@/styles/dashboard/CardGlobal'
import { AiOutlineDrag } from 'react-icons/ai'
import styled from 'styled-components'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ItemDeleteAlertDialog } from './ItemDeleteAlertDialog'
import { Layout } from 'react-grid-layout'
import { AccessibilityContainer } from './AccessibilityContainer'
import { EntityCardInfo } from '@/types/EntityCardInfo'
import { Skeleton } from '@/components/ui/skeleton'
import { ResponsiveLine } from '@nivo/line'
import { Switch } from '@/components/ui/switch'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/ChartThemes'

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
  configuration: EntityCardInfo
}

export const EntityCard = ({ cardID, layout, setLayout, cols, breakPoint, editModeEnabled, handleDeleteItem, width, height, setHighlightedCardID, configuration }: EntityCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isDarkMode } = useDarkMode()

  const [highlight, setHighlight] = useState<'width' | 'height' | null>(null)

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

  if (!configuration || !configuration.rows) {
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
      <div className="pl-4 pt-2 font-semibold">{configuration.title}</div>
      <ChartContainer ref={containerRef} $editModeEnabled={editModeEnabled}>
        <table className="w-full h-fit">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-left text-md">Name</th>
              <th className="text-center text-md">Visualization</th>
            </tr>
          </thead>
          <tbody>
            {configuration.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="text-sm">{row.name}</td>
                {row.visualization === 'sparkline' && row.sparkLineData && (
                  <td className="text-sm text-center w-[75px] h-[24px]">
                    <ResponsiveLine
                      data={[
                        {
                          id: 'temperature',
                          data: row.sparkLineData?.data!
                        }
                      ]}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                      xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%S.%LZ' }}
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
                {row.visualization === 'immediate' && <td className="text-sm text-center">{row.value}</td>}
                {row.visualization === 'switch' && (
                  <td className="text-sm text-center">
                    <Switch checked={row.value === 'on'} />
                  </td>
                )}
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
