import { memo, MouseEvent, useState, useRef, useMemo, useEffect } from 'react'
import { ResponsiveBullet, BulletSvgProps, Datum } from '@nivo/bullet'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '@/features/dashboard/components/cards/components/ChartThemes'
import { useInstances } from '@/context/InstancesContext'
import { BulletChartToolTip } from '../cards/tooltips/BulletChartToolTIp'
import { BulletCardConfig } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { getColorBlindScheme } from './color-schemes/color-impaired'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { useLongPress } from '@uidotdev/usehooks'

export interface ResponsiveBulletProps {
  data: Datum
  rowConfig?: BulletCardConfig['rows'][number]
  onElementClick?: (data: any, event: MouseEvent) => void
}

const LONG_PRESS_THRESHOLD = 200

const ResponsiveBulletBase = ({ data, rowConfig, onElementClick }: ResponsiveBulletProps) => {
  const { isDarkMode } = useDarkMode()
  const { getInstanceById } = useInstances()
  const { setDetailsSelectedDevice } = useDeviceDetail()
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [touchTooltipVisible, setTouchTooltipVisible] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartRect, setChartRect] = useState<DOMRect | null>(null)
  const attrs = useLongPress(
    () => {
      if (chartRef.current) setChartRect(chartRef.current.getBoundingClientRect())
      setTouchTooltipVisible(true)
    },
    {
      threshold: LONG_PRESS_THRESHOLD,
      onFinish: (e) => {
        e.preventDefault()
        setTouchTooltipVisible(false)
      },
      onCancel: () => {
        setTouchTooltipVisible(false)
      }
    }
  )

  const preventTouchMove = (e: TouchEvent) => {
    e.preventDefault()
  }

  useEffect(() => {
    if (touchTooltipVisible) {
      document.addEventListener('touchmove', preventTouchMove, { passive: false })

      return () => {
        document.removeEventListener('touchmove', preventTouchMove)
      }
    }
  }, [touchTooltipVisible])

  const handleMouseEnter = () => {
    if (chartRef.current) setChartRect(chartRef.current.getBoundingClientRect())
    setTooltipVisible(true)
  }

  const handleMouseLeave = () => {
    setTooltipVisible(false)
  }

  // default config
  const {
    margin = { top: 10, right: 10, bottom: 30, left: 10 },
    spacing = 46,
    titleAlign = 'end',
    measureSize = 0.2,
    minValue = 'auto',
    maxValue = 'auto',
    rangeColors = rowConfig?.config?.colorScheme === 'greys'
      ? ['#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3']
      : getColorBlindScheme(),
    measureColors = 'seq:red_purple'
  } = (rowConfig?.config || {}) as Partial<BulletSvgProps>

  const handleClick = (data: any, event: React.MouseEvent) => {
    if (onElementClick) {
      setTooltipVisible(false)
      setTouchTooltipVisible(false)
      onElementClick(data, event)
      return
    }

    setTooltipVisible(false)
    setTouchTooltipVisible(false)
    setDetailsSelectedDevice(rowConfig?.instance?.id!, rowConfig?.parameter?.id!)
  }

  const tooltipTriggerData = useMemo(() => {
    return {
      instanceName: getInstanceById(rowConfig?.instance?.id!)?.userIdentifier || 'Unknown',
      parameterName: rowConfig?.parameter?.denotation || '',
      value: String(data.measures[0]),
      targets: data.markers || []
    }
  }, [data, rowConfig, getInstanceById])

  return (
    <>
      <div
        ref={chartRef}
        className="h-full w-full select-none"
        {...attrs}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <ResponsiveBullet
          data={[data]}
          margin={margin}
          spacing={spacing}
          titleAlign={titleAlign}
          titleOffsetX={-5}
          measureSize={measureSize}
          minValue={minValue}
          maxValue={maxValue}
          rangeColors={rangeColors}
          measureColors={measureColors}
          theme={isDarkMode ? darkTheme : lightTheme}
          animate={true}
          onRangeClick={handleClick}
          onMeasureClick={handleClick}
          onMarkerClick={handleClick}
          tooltip={() => null}
        />
      </div>
      <BulletChartToolTip
        instanceName={tooltipTriggerData.instanceName}
        parameterName={tooltipTriggerData.parameterName}
        currentValue={tooltipTriggerData.value}
        targetValues={tooltipTriggerData.targets}
        chartRect={chartRect}
        visible={tooltipVisible || touchTooltipVisible}
      />
    </>
  )
}

ResponsiveBulletBase.displayName = 'ResponsiveBulletBase'

export const ResponsiveBulletChart = memo(ResponsiveBulletBase)
