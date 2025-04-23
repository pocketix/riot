import { MouseEvent, useState, useRef, useMemo, useEffect, memo } from 'react'
import { ResponsiveBullet, BulletSvgProps, Datum, BulletMarkersItemProps } from '@nivo/bullet'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '@/features/dashboard/components/cards/components/ChartThemes'
import { useInstances } from '@/context/InstancesContext'
import { BulletChartToolTip } from '../cards/tooltips/BulletChartToolTip'
import { BulletCardConfig } from '@/schemas/dashboard/visualizations/BulletChartBuilderSchema'
import { getColorBlindSchemeBullet } from './color-schemes/color-impaired'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { useLongPress } from '@uidotdev/usehooks'

export interface ResponsiveBulletProps {
  data: Datum
  rowConfig?: BulletCardConfig['rows'][number]
  lastUpdated?: Date
  onElementClick?: (data: any, event: MouseEvent) => void
}

const LONG_PRESS_THRESHOLD = 200

const bulletMarker = (props: BulletMarkersItemProps) => {
  const { size, x, y, color } = props

  const lineHeight = size
  const triangleSize = 10

  const fill = color
  const stroke = color
  const lineWidth = 2.5

  return (
    <g transform={`translate(${x}, ${-5})`}>
      <line x1={0} y1={0} x2={0} y2={lineHeight + y + 5} stroke={fill} strokeWidth={lineWidth} />
      <polygon
        points={`${-triangleSize / 2},0 ${triangleSize / 2},0 0,${triangleSize}`}
        fill={stroke}
        stroke={stroke}
        strokeWidth={1}
      />
    </g>
  )
}

const ResponsiveBulletBase = ({ data, rowConfig, lastUpdated, onElementClick }: ResponsiveBulletProps) => {
  const { isDarkMode } = useDarkMode()
  const { getInstanceById, getParameterByIds } = useInstances()
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
    margin = { top: 0, right: 10, bottom: 30, left: 10 },
    spacing = 46,
    titleAlign = 'end', // not configurable
    reverse = false,
    titleOffsetX = -5,
    measureSize = 0.2,
    minValue = 'auto',
    maxValue = 'auto',
    rangeColors = rowConfig?.config?.colorScheme === 'greys'
      ? ['#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3']
      : getColorBlindSchemeBullet(),
    measureColors = rowConfig?.config?.colorScheme === 'greys' ? ['#f700ff'] : ['black'],
    markerColors = rowConfig?.config?.colorScheme === 'greys' ? ['#f700ff'] : isDarkMode ? ['white'] : ['black']
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
    const wholeInstance = getInstanceById(rowConfig?.instance?.id!)
    const wholeParameter = getParameterByIds(rowConfig?.instance?.id!, rowConfig?.parameter?.id!)
    return {
      instanceName: wholeInstance?.userIdentifier || 'Unknown',
      parameterName: wholeParameter?.label || wholeParameter?.denotation || 'Unknown',
      value: String(data.measures[0]),
      targets: data.markers || [],
      lastUpdated: lastUpdated,
      decimalPlaces: rowConfig?.config.decimalPlaces,
      timeFrame: rowConfig?.config.timeFrame,
      aggregateFunction: rowConfig?.config.function
    }
  }, [data, rowConfig, getInstanceById])

  const minDataValue = useMemo(() => {
    if (data.ranges.length === 0) return 0
    return Math.min(...data.ranges) * 1.2
  }, [data])

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
          margin={{ ...margin, top: margin.top! + 5 }}
          spacing={spacing}
          titleAlign={titleAlign}
          reverse={reverse}
          titleOffsetX={titleOffsetX}
          markerComponent={bulletMarker}
          measureSize={measureSize}
          minValue={minValue === 'auto' ? minDataValue : minValue}
          maxValue={maxValue}
          rangeColors={rangeColors}
          measureColors={measureColors}
          theme={isDarkMode ? darkTheme : lightTheme}
          animate={true}
          markerColors={markerColors}
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
        aggregateFunction={tooltipTriggerData.aggregateFunction}
        decimalPlaces={tooltipTriggerData.decimalPlaces}
        timeFrame={tooltipTriggerData.timeFrame}
        lastUpdated={tooltipTriggerData.lastUpdated}
        chartRect={chartRect}
        visible={tooltipVisible || touchTooltipVisible}
      />
    </>
  )
}

ResponsiveBulletBase.displayName = 'ResponsiveBulletBase'

export const ResponsiveBulletChart = memo(ResponsiveBulletBase)
