import { Container, DeleteEditContainer, DragHandle } from '@/styles/dashboard/CardGlobal'
import { AiOutlineDrag } from 'react-icons/ai'
import styled from 'styled-components'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { ItemDeleteAlertDialog } from './components/ItemDeleteAlertDialog'
import { Layout } from 'react-grid-layout'
import { AccessibilityContainer } from './components/AccessibilityContainer'
import { Skeleton } from '@/components/ui/skeleton'
import { CardEditDialog } from '../editors/CardEditDialog'
import { AllConfigTypes, BuilderResult } from '@/types/dashboard/GridItem'

export const ChartContainer = styled.div<{ $editModeEnabled?: boolean }>`
  position: relative;
  margin: 0;
  padding: 2px 2px 2px 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-grow: 1;
  overflow-y: hidden;
  overflow-x: hidden;

  opacity: ${(props) => (props.$editModeEnabled ? 0.25 : 1)};
  transition: opacity 0.3s;
`

export interface BaseCardProps<ConfigType extends AllConfigTypes> {
  cardID: string
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
  handleSaveEdit: (config: BuilderResult<ConfigType>) => void
  configuration: ConfigType

  // Specific to each card implementation
  isLoading: boolean
  error: string | null
  visualizationType: 'table' | 'bullet' | 'line' | 'entitycard'
  cardTitle?: string
  children: ReactNode
}

export const BaseCard = <ConfigType extends AllConfigTypes>({
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
  beingResized,
  handleSaveEdit,
  configuration,
  isLoading,
  error,
  visualizationType,
  cardTitle,
  children
}: BaseCardProps<ConfigType>) => {
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
  }, [cardID, highlight, setHighlightedCardID])

  if (isLoading || beingResized || error) {
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
          <CardEditDialog config={configuration} onSave={handleSaveEdit} visualizationType={visualizationType} />
          <ItemDeleteAlertDialog onSuccess={() => handleDeleteItem(cardID)} />
        </DeleteEditContainer>
      )}

      {cardTitle && <span className="pl-2 pt-2 font-semibold">{cardTitle}</span>}

      <ChartContainer $editModeEnabled={editModeEnabled}>{children}</ChartContainer>

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
