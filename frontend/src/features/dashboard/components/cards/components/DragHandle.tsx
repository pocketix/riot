import { forwardRef } from 'react'
import styled from 'styled-components'
import { RxCornerBottomRight } from 'react-icons/rx'

interface ResizeHandleProps {
  $editMode: boolean
  handleAxis?: string
}

const ResizeHandle = styled.div<{ $editMode: boolean }>`
  position: absolute;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  z-index: 1;
  display: ${({ $editMode }) => ($editMode ? 'block' : 'none')};
  &.handle-se {
    bottom: 0px;
    right: 0px;
    transform: none;
  }
`

export const MyHandle = forwardRef<HTMLDivElement, ResizeHandleProps>(
  ({ handleAxis, $editMode, ...restProps }, ref) => {
    return (
      <ResizeHandle ref={ref} className={`resizeHandle handle-${handleAxis}`} $editMode={$editMode} {...restProps}>
        <RxCornerBottomRight className="h-full w-full" />
      </ResizeHandle>
    )
  }
)
