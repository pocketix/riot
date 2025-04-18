import { Layout } from 'react-grid-layout'
import { FaLongArrowAltDown, FaLongArrowAltUp, FaLongArrowAltLeft, FaLongArrowAltRight } from 'react-icons/fa'
import { Arrow, ArrowContainer } from '@/styles/dashboard/CardGlobal'
import { moveWidget } from '@/lib/dashboard/LayoutArrows'
import { ResizePopover } from './ResizePopover'
import { TbBorderBottomPlus, TbBorderRightPlus } from 'react-icons/tb'
import { useMemo } from 'react'

export interface AccessibilityContainerProps {
  cols: { lg: number; md: number; xs: number; xxs: number }
  layout: Layout[]
  setLayout: (layout: Layout[]) => void
  breakPoint: string
  cardID: string
  setHighlight: (highlight: 'width' | 'height' | null) => void
  isAtRightEdge: boolean
  isAtLeftEdge: boolean
  isAtTopEdge: boolean
  isBottom: boolean
}

export const AccessibilityContainer = ({
  cols,
  layout,
  setLayout,
  breakPoint,
  cardID,
  setHighlight,
  isAtRightEdge,
  isAtLeftEdge,
  isAtTopEdge,
  isBottom
}: AccessibilityContainerProps) => {
  // Get the item from the layout
  const item = useMemo(() => layout.find((item) => item.i === cardID), [layout, cardID])

  const handleMove = (
    direction: 'left' | 'right' | 'up' | 'down' | 'widthminus' | 'widthplus' | 'heightminus' | 'heightplus'
  ) => {
    const columnCount = cols[breakPoint as keyof typeof cols]
    const newLayout = moveWidget(layout, cardID, direction, columnCount)
    setLayout(newLayout)
  }

  // Only show the popover if at least one of the buttons is enabled
  const showWidthResize = !(item?.w === item?.minW && (isAtRightEdge || item?.w === item?.maxW))
  const showHeightResize = !(item?.h === item?.minH && item?.h === item?.maxH)

  return (
    <ArrowContainer>
      {!isAtLeftEdge && (
        <Arrow onClick={() => handleMove('left')}>
          <FaLongArrowAltLeft />
        </Arrow>
      )}

      {!isAtTopEdge && (
        <Arrow onClick={() => handleMove('up')}>
          <FaLongArrowAltUp />
        </Arrow>
      )}

      {isBottom && (
        <Arrow onClick={() => handleMove('down')}>
          <FaLongArrowAltDown />
        </Arrow>
      )}

      {!isAtRightEdge && (
        <Arrow onClick={() => handleMove('right')}>
          <FaLongArrowAltRight />
        </Arrow>
      )}

      {showWidthResize && (
        <ResizePopover
          onDecrease={() => handleMove('widthminus')}
          onIncrease={() => handleMove('widthplus')}
          maxValue={item?.maxW}
          minValue={item?.minW || 1}
          currentValue={item?.w}
          rightEdge={isAtRightEdge}
          highlight="width"
          setHighlight={setHighlight}
        >
          <TbBorderRightPlus />
        </ResizePopover>
      )}

      {showHeightResize && (
        <ResizePopover
          onDecrease={() => handleMove('heightminus')}
          onIncrease={() => handleMove('heightplus')}
          maxValue={item?.maxH}
          minValue={item?.minH || 1}
          currentValue={item?.h}
          highlight="height"
          setHighlight={setHighlight}
        >
          <TbBorderBottomPlus />
        </ResizePopover>
      )}
    </ArrowContainer>
  )
}
