import { Container, DragHandle } from '@/styles/dashboard/CardGlobal'
import { AiOutlineDrag } from 'react-icons/ai'
import styled from 'styled-components'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ItemDeleteAlertDialog } from './ItemDeleteAlertDialog'
import { Layout } from 'react-grid-layout'
import { AccessibilityContainer } from './AccessibilityContainer'
import { TableCardInfo } from '@/types/TableCardInfo'
import { SdParameterType } from '@/generated/graphql'

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
  data?: TableCardInfo
}

export const TableCard = ({ cardID, layout, setLayout, cols, breakPoint, editModeEnabled, handleDeleteItem, width, height, setHighlightedCardID, data }: TableCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

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

  // calculate height and width from getboundingclientrect
  const example_data: TableCardInfo = {
    _cardID: 'exampleCardID',
    title: 'Sensor',
    icon: 'temperature-icon',
    aggregatedTime: '1h',
    instances: [
      {
        order: 1,
        instance: {
          uid: 'instance1',
          id: 'instance1-id',
          userIdentifier: 'example-user'
        },
        params: [
          {
            denotation: 'temperature',
            id: '1',
            type: SdParameterType.Number
          }
        ]
      }
    ],
    columns: [
      {
        header: 'Mean',
        function: 'MEAN'
      },
      {
        header: 'Min',
        function: 'MIN'
      },
      {
        header: 'Max',
        function: 'MAX'
      }
    ],
    rows: [
      {
        name: 'Kitchen',
        values: [
          {
            value: '22.5'
          },
          {
            value: '20.5'
          },
          {
            value: '24.5'
          }
        ]
      },
      {
        name: 'Living Room',
        values: [
          {
            value: '23.1'
          },
          {
            value: '21.5'
          },
          {
            value: '24.5'
          }
        ]
      },
      {
        name: 'Bathroom',
        values: [
          {
            value: '21.8'
          },
          {
            value: '19.5'
          },
          {
            value: '24.3'
          }
        ]
      }
    ]
  }

  data = example_data

  return (
    <Container key={cardID} className={`${cardID}`}>
      {editModeEnabled && (
        <DragHandle>
          <AiOutlineDrag className="drag-handle w-[40px] h-[40px] p-1 border-2 rounded-lg" />
        </DragHandle>
      )}
      {editModeEnabled && <ItemDeleteAlertDialog onSuccess={() => handleDeleteItem(cardID)} />}
      {/* <div className="pl-4 pt-2 font-semibold">{title}</div> */}
      <ChartContainer ref={containerRef} $editModeEnabled={editModeEnabled}>
        <table className="w-full h-fit">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-left text-md">{data.title}</th>
              {data.columns.map((column, index) => (
                <th key={index} className="text-center text-xs">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="text-sm">{row.name}</td>
                {row.values.map((value, valueIndex) => (
                  <td key={valueIndex} className="text-sm text-center">
                    {value.value}
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
