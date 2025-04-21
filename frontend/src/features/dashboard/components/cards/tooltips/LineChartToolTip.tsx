import { PointTooltipProps } from '@nivo/line'
import { NonOverflowTooltip } from '@/features/dashboard/components/NonOverflowTooltip'
import { useDarkMode } from '@/context/DarkModeContext'

export interface ToolTipProps {
  position: PointTooltipProps
  containerRef: React.RefObject<HTMLDivElement>
  instanceName?: string
  parameterName?: string
  xName?: string
  yName?: string
}

export const ChartToolTip = ({ position, containerRef, instanceName, parameterName, xName, yName }: ToolTipProps) => {
  const { isDarkMode } = useDarkMode()
  const [date, time] = String(position.point.data.xFormatted).split(' ')
  const containerWidth = containerRef.current?.getBoundingClientRect().width

  return (
    <>
      {containerRef && (
        <NonOverflowTooltip
          point={{ x: position.point.x, y: position.point.y }}
          isDarkMode={isDarkMode}
          container={containerRef as React.RefObject<HTMLDivElement>}
        >
          <div className="flex flex-col justify-center">
            <span className="text-center font-bold">{instanceName}</span>
            <span className="font-bold">{parameterName}</span>
          </div>
          <div className={`flex ${containerWidth! < 300 ? 'flex-col' : 'gap-1'} justify-center`}>
            <div>
              {xName ? xName : 'X'}: <span className="text-xs">{date}</span>
            </div>
            <span className="text-center text-xs font-semibold">{time}</span>
          </div>
          <div>
            {yName ? yName : 'Y'}: <span className="font-bold">{position.point.data.yFormatted}</span>
          </div>
        </NonOverflowTooltip>
      )}
    </>
  )
}
