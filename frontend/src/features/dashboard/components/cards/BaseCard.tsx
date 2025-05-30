import { Container, DeleteEditContainer, DragHandle, OverlayContainer } from '@/styles/dashboard/CardGlobal'
import { AiOutlineDrag } from 'react-icons/ai'
import styled from 'styled-components'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveAlertDialog } from './components/ResponsiveAlertDialog'
import { AccessibilityContainer } from './components/AccessibilityContainer'
import { Skeleton } from '@/components/ui/skeleton'
import { CardEditDialog } from '../editors/CardEditDialog'
import { AllConfigTypes } from '@/types/dashboard/gridItem'
import { BaseCardProps } from '@/types/dashboard/cards/cardGeneral'
import { getCustomizableIcon } from '@/utils/getCustomizableIcon'

export const ChartContainer = styled.div<{ $editModeEnabled?: boolean }>`
  position: relative;
  margin: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-grow: 1;
  overflow-y: hidden;
  overflow-x: hidden;

  opacity: ${(props) => (props.$editModeEnabled ? 0.25 : 1)};
  transition: opacity 0.3s;
`
export function BaseCard<ConfigType extends AllConfigTypes>(props: BaseCardProps<ConfigType>) {
  const [highlight, setHighlight] = useState<'width' | 'height' | null>(null)
  const item = useMemo(() => props.layout.find((item) => item.i === props.cardID), [props.layout, props.cardID])

  useEffect(() => {
    setHighlight(null)
  }, [props.editModeEnabled])

  let isAtRightEdge = false
  let isAtLeftEdge = false
  let isAtTopEdge = false
  let isBottom = false

  if (item) {
    isAtRightEdge = useMemo(() => {
      return item?.x + item?.w === props.cols[props.breakPoint as keyof typeof props.cols]
    }, [item, props.cols, props.breakPoint])

    isAtLeftEdge = useMemo(() => {
      return item?.x === 0
    }, [item])

    isAtTopEdge = useMemo(() => {
      return item?.y === 0
    }, [item])

    isBottom = useMemo(() => {
      return props.layout.some((l) => l.y === item.y + item.h && l.x < item.x + item.w && l.x + l.w > item.x)
    }, [props.layout, item])
  }

  useEffect(() => {
    if (highlight) props.setHighlightedCardID(props.cardID)
  }, [props.cardID, highlight, props.setHighlightedCardID])

  const IconComponent = props.cardIcon ? getCustomizableIcon(props.cardIcon) : null

  if (props.isLoading || props.beingResized) {
    return (
      <Skeleton className="relative h-full w-full">
        {props.editModeEnabled && (
          <DeleteEditContainer>
            <ResponsiveAlertDialog onSuccess={() => props.handleDeleteItem(props.cardID, props.breakPoint)} />
          </DeleteEditContainer>
        )}
        {props.editModeEnabled && (
          <AccessibilityContainer
            cols={props.cols}
            layout={props.layout}
            setLayout={props.setLayout}
            breakPoint={props.breakPoint}
            cardID={props.cardID}
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
                style={{ width: `${props.width}px` }}
                className={`absolute left-full top-0 h-full ${highlight ? 'opacity-50' : 'opacity-0'} rounded-r-lg bg-green-400 transition-opacity duration-200`}
              />
            )}
            {item?.w !== 1 && item?.w !== item?.minW && (
              <div
                style={{ width: `${props.width}px` }}
                className={`absolute right-0 top-0 h-full ${highlight ? 'opacity-50' : 'opacity-0'} rounded-r-lg bg-red-400 transition-opacity duration-200`}
              />
            )}
          </>
        )}
        {highlight === 'height' && (
          <>
            {item?.h !== item?.maxH && (
              <div
                style={{ height: `${props.height}px` }}
                className={`absolute left-0 top-full w-full ${highlight ? 'opacity-50' : 'opacity-0'} rounded-b-lg bg-green-400 transition-opacity duration-200`}
              />
            )}
            {item?.h !== item?.minH && item?.h !== 1 && (
              <div
                style={{ height: `${props.height}px` }}
                className={`absolute bottom-0 left-0 w-full ${highlight ? 'opacity-50' : 'opacity-0'} rounded-b-lg bg-red-400 transition-opacity duration-200`}
              />
            )}
          </>
        )}
      </Skeleton>
    )
  }

  return (
    <Container key={props.cardID} className={`${props.cardID}`}>
      {props.editModeEnabled && (
        <DragHandle>
          <AiOutlineDrag className="drag-handle h-7 w-7 rounded-lg p-0.5" />
        </DragHandle>
      )}
      {props.editModeEnabled && (
        <DeleteEditContainer>
          <CardEditDialog
            config={props.configuration}
            onSave={props.handleSaveEdit}
            visualizationType={props.visualizationType}
          />
          <ResponsiveAlertDialog onSuccess={() => props.handleDeleteItem(props.cardID, props.breakPoint)} />
        </DeleteEditContainer>
      )}
      {props.cardTitle && (
        <div className="flex items-center gap-1 px-1 pt-1">
          {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground" />}
          {props.cardTitle && <span className="font-semibold">{props.cardTitle}</span>}
        </div>
      )}

      <ChartContainer $editModeEnabled={props.editModeEnabled}>
        {props.children}
        {props.error && (
          <div className="absolute left-0 top-0 z-10 flex h-full w-full items-center justify-center rounded-lg bg-destructive text-primary">
            <span className="text-sm font-semibold">{props.error}</span>
          </div>
        )}
      </ChartContainer>

      {props.editModeEnabled && <OverlayContainer />}
      {props.editModeEnabled && (
        <AccessibilityContainer
          cols={props.cols}
          layout={props.layout}
          setLayout={props.setLayout}
          breakPoint={props.breakPoint}
          cardID={props.cardID}
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
              style={{ width: `${props.width}px` }}
              className={`absolute left-full top-0 h-full ${highlight ? 'opacity-50' : 'opacity-0'} rounded-r-lg bg-green-400 transition-opacity duration-200`}
            />
          )}
          {item?.w !== 1 && item?.w !== item?.minW && (
            <div
              style={{ width: `${props.width}px` }}
              className={`absolute right-0 top-0 h-full ${highlight ? 'opacity-50' : 'opacity-0'} bg-red-400 transition-opacity duration-200`}
            />
          )}
        </>
      )}

      {highlight === 'height' && (
        <>
          {item?.h !== item?.maxH && (
            <div
              style={{ height: `${props.height}px` }}
              className={`absolute left-0 top-full w-full ${highlight ? 'opacity-50' : 'opacity-0'} rounded-b-lg bg-green-400 transition-opacity duration-200`}
            />
          )}
          {item?.h !== item?.minH && item?.h !== 1 && (
            <div
              style={{ height: `${props.height}px` }}
              className={`absolute bottom-0 left-0 w-full ${highlight ? 'opacity-50' : 'opacity-0'} bg-red-400 transition-opacity duration-200`}
            />
          )}
        </>
      )}
    </Container>
  )
}
