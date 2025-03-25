import { useDarkMode } from '@/context/DarkModeContext'
import { ToolTipContainer } from '../components/ChartGlobals'

interface BulletChartToolTipProps {
  instanceName?: string
  parameterName?: string
  currentValue?: string
  targetValues?: number[]
}

export const BulletChartToolTip = ({
  instanceName,
  parameterName,
  currentValue,
  targetValues
}: BulletChartToolTipProps) => {
  const { isDarkMode } = useDarkMode()

  const formattedTargetValues = targetValues?.map((value) => value.toFixed(2))
  const targets = formattedTargetValues?.join(' - ')
  return (
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
      </div>
    </ToolTipContainer>
  )
}
