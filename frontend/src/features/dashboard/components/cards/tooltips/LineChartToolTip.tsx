import { PointTooltipProps } from '@nivo/line'
import { NonOverflowTooltip } from '@/features/dashboard/components/NonOverflowTooltip'
import { useDarkMode } from '@/context/DarkModeContext'

export interface ToolTipProps {
  position: PointTooltipProps
  containerRef: React.RefObject<HTMLDivElement>
  xName?: string
  yName?: string
}

export const ToolTip = ({ position, containerRef, xName, yName }: ToolTipProps) => {
  const { isDarkMode } = useDarkMode()

  return (
    <>
      {containerRef && (
        <NonOverflowTooltip point={{ x: position.point.x, y: position.point.y }} isDarkMode={isDarkMode} container={containerRef as React.RefObject<HTMLDivElement>}>
          <div>
            {xName ? xName : 'X'}: <span className="font-bold">{new Date(position.point.data.xFormatted).toLocaleString()}</span>
          </div>
          <div>
            {yName ? yName : 'Y'}: <span className="font-bold">{position.point.data.yFormatted}</span>
          </div>
        </NonOverflowTooltip>
      )}
    </>
  )
}
