import { useDarkMode } from '@/context/DarkModeContext'
import { ToolTipContainer } from '../components/ChartGlobals'
import { Portal } from '@radix-ui/react-portal'
import { CSSProperties, useEffect, useState } from 'react'
import { StatisticsOperation } from '@/generated/graphql'

interface BulletChartToolTipProps {
  instanceName?: string
  parameterName?: string
  currentValue?: string
  targetValues?: number[]
  aggregateFunction?: string
  timeFrame?: string
  chartRect?: DOMRect | null
  lastUpdated?: Date
  visible: boolean
}

export const BulletChartToolTip = ({
  instanceName,
  parameterName,
  currentValue,
  targetValues,
  aggregateFunction,
  timeFrame,
  chartRect,
  lastUpdated,
  visible
}: BulletChartToolTipProps) => {
  const { isDarkMode } = useDarkMode()
  const formattedTargetValues = targetValues?.map((value) => value.toFixed(2))
  const targets = formattedTargetValues?.join(' - ')
  const [position, setPosition] = useState<{ top: string; left: string }>({ top: '0', left: '0' })
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top')

  useEffect(() => {
    if (!chartRect) return

    const centerX = chartRect.left + chartRect.width / 2
    const windowHeight = window.innerHeight
    const spaceAbove = chartRect.top
    const spaceBelow = windowHeight - (chartRect.top + chartRect.height)

    if (spaceAbove > 100 || spaceAbove > spaceBelow) {
      setPlacement('top')
      setPosition({
        top: `${chartRect.top - 0}px`,
        left: `${centerX}px`
      })
    } else {
      setPlacement('bottom')
      setPosition({
        top: `${chartRect.top + chartRect.height + 0}px`,
        left: `${centerX}px`
      })
    }
  }, [chartRect, visible])

  const tooltipStyle: CSSProperties = {
    position: 'fixed',
    left: position.left,
    top: position.top,
    transform: placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
    zIndex: 100,
    pointerEvents: 'none',
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out'
  }

  return (
    <Portal>
      <div style={tooltipStyle}>
        <ToolTipContainer $offsetHorizontal={0} $offsetVertical={0} $isDarkMode={isDarkMode}>
          <div className="flex flex-col">
            <div>
              <span className="font-bold">{instanceName}</span>
            </div>
            <div>
              <span className="font-bold">{parameterName?.toLocaleUpperCase()}</span>
            </div>
            <div>
              Current Value: <span className="font-bold">{currentValue}</span>
            </div>
            <div>
              Target Value: <span className="font-bold">{targets}</span>
            </div>
            {lastUpdated && (
              <div>
                Updated: <span className="font-bold">{lastUpdated?.toLocaleString()}</span>
              </div>
            )}
            <div>
              <span className="text-xs">Function: </span>
              <span className="text-xs font-bold">{aggregateFunction}</span>
            </div>
            {aggregateFunction !== StatisticsOperation.Last && (
              <div>
                <span className="text-xs">Time Frame (h): </span>
                <span className="text-xs font-bold">{timeFrame}</span>
              </div>
            )}
          </div>
        </ToolTipContainer>
      </div>
    </Portal>
  )
}
