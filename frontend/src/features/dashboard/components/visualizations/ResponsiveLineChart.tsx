import { forwardRef, useRef, CSSProperties, memo, RefObject, useState, useEffect } from 'react'
import { CustomLayerProps, LineSvgProps, PointTooltipProps, ResponsiveLine, Serie } from '@nivo/line'
import { useDarkMode } from '@/context/DarkModeContext'
import { timeTicksLayer, getMaxValue } from '@/features/dashboard/components/utils/charts/tickUtils'
import { darkTheme, lightTheme } from '@/features/dashboard/components/cards/components/ChartThemes'
import { ChartToolTip } from '@/features/dashboard/components/cards/tooltips/LineChartToolTip'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { ScaleSpec } from '@nivo/scales'
import { useInstances } from '@/context/InstancesContext'
import { ChartCardConfig } from '@/schemas/dashboard/LineChartBuilderSchema'
import { getColorBlindSchemeWithBW } from './color-schemes/color-impaired'
import { useLongPress } from '@uidotdev/usehooks'

export interface ResponsiveLineChartProps {
  className?: string
  data: Serie[]
  config?: Partial<ChartCardConfig> | Partial<LineSvgProps>
  onPointClick?: (point: any, event: React.MouseEvent) => void
  detailsOnClick?: boolean
  height?: number
  useSparklineMode?: boolean
}

const ResponsiveLineChartBase = forwardRef<HTMLDivElement, ResponsiveLineChartProps>(
  ({ className, data, config = {}, height, detailsOnClick = true, useSparklineMode }, forwardedRef) => {
    const { getInstanceById, getParameterByIds } = useInstances()
    const { isDarkMode } = useDarkMode()
    const localContainerRef = useRef<HTMLDivElement>(null)
    const { setDetailsSelectedDevice } = useDeviceDetail()

    const preventTouchMove = (e: TouchEvent) => {
      e.preventDefault()
    }

    const attrs = useLongPress(
      () => {
        document.addEventListener('touchstart', preventTouchMove, { passive: false })
        document.addEventListener('touchmove', preventTouchMove, { passive: false })
        document.addEventListener('touchend', preventTouchMove, { passive: false })
        document.addEventListener('touchcancel', preventTouchMove, { passive: false })
      },
      {
        threshold: 100,
        onFinish: () => {
          document.removeEventListener('touchstart', preventTouchMove)
          document.removeEventListener('touchmove', preventTouchMove)
          document.removeEventListener('touchend', preventTouchMove)
          document.removeEventListener('touchcancel', preventTouchMove)
        }
      }
    )

    const containerRef: RefObject<HTMLDivElement> =
      forwardedRef && 'current' in forwardedRef ? (forwardedRef as RefObject<HTMLDivElement>) : localContainerRef
    const isChartCardConfig = 'margin' in config && 'yScale' in config && 'toolTip' in config

    const [tickValues, setTickValues] = useState(6)

    // not really necessary, as the amount of ticks if fine upon initial render
    // this handles window/chart resizing
    useEffect(() => {
      if (!containerRef.current) return

      const updateTickValues = () => {
        if (containerRef.current) {
          setTickValues(Math.floor(containerRef.current.clientHeight / 30))
        }
      }

      updateTickValues()

      const resizeObserver = new ResizeObserver(updateTickValues)
      resizeObserver.observe(containerRef.current)

      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current)
        }
        resizeObserver.disconnect()
      }
    }, [containerRef])

    // Default config, if no config is provided
    const {
      margin = { top: 10, right: 10, bottom: 20, left: 40 },
      enableGridX = true,
      enableGridY = true,
      pointSize = 5,
      yFormat,
      pointBorderWidth = 0,
      curve = 'linear',
      axisLeft,
      axisBottom,
      onClick,
      tooltip
    } = config as Partial<LineSvgProps>

    const mergedConfig = isChartCardConfig
      ? {
          margin: (config as ChartCardConfig).margin,
          yScale: (config as ChartCardConfig).yScale,
          yFormat: (config as ChartCardConfig).toolTip?.yFormat,
          axisBottom: {
            ...(config as ChartCardConfig).axisBottom,
            tickValues: 0 // we are generating the ticks by the custom layer called timeTicksLayer
          },
          axisLeft: {
            ...(config as ChartCardConfig).axisLeft,
            format: '~s'
          },
          enableGridX: (config as ChartCardConfig).enableGridX || false,
          enableGridY: (config as ChartCardConfig).enableGridY || true,
          pointSize: (config as ChartCardConfig).pointSize || 5,
          tooltipConfig: {
            xName: (config as ChartCardConfig).toolTip.x,
            yName: (config as ChartCardConfig).toolTip.y,
            yFormat: (config as ChartCardConfig).toolTip?.yFormat
          }
        }
      : {
          margin,
          yScale: {
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: false,
            nice: true
          },
          yFormat,
          axisBottom: {
            ...axisBottom,
            tickValues: 0
          },
          axisLeft: {
            ...axisLeft,
            format: '~s'
          },
          enableGridX,
          enableGridY,
          pointSize,
          tooltipConfig: {
            xName: 'Time',
            yName: 'Value'
          }
        }

    if (useSparklineMode) {
      return (
        <div className={className || ''} style={{ height: '100%', width: '100%' }} ref={containerRef}>
          <ResponsiveLine
            data={data}
            margin={{ top: 2, right: 2, bottom: 3, left: 2 }}
            xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%SZ' }}
            xFormat="time:%Y-%m-%d %H:%M:%S"
            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
            animate={false}
            pointSize={0}
            axisBottom={null}
            axisLeft={null}
            curve="cardinal"
            lineWidth={2}
            enableGridX={false}
            enableGridY={false}
            useMesh={false}
            theme={isDarkMode ? darkTheme : lightTheme}
          />
        </div>
      )
    }

    const handlePointClick = (point: any, event: React.MouseEvent) => {
      // override
      if (onClick) {
        onClick(point, event)
        return
      }

      if (!detailsOnClick) return

      const pointIdParts = point.id.split(' ')
      const rawInstanceID = pointIdParts.length > 1 ? pointIdParts[1].trim() : ''

      const lastDotIndex = rawInstanceID.lastIndexOf('.')
      const instanceID = lastDotIndex !== -1 ? rawInstanceID.substring(0, lastDotIndex) : rawInstanceID
      const parameterID = pointIdParts[0].trim()

      setDetailsSelectedDevice(Number(instanceID), Number(parameterID))
    }

    // minWidth 0 makes the chart responsive when adjusting the window size
    // https://stackoverflow.com/questions/59276119/nivo-responsive-line-graph-only-responsive-on-making-wider-not-making-narrower
    const containerStyle: CSSProperties = height
      ? {
          height: `${height}px`,
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          userSelect: 'none',
          touchAction: 'none'
        }
      : {
          height: '100%',
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          userSelect: 'none',
          touchAction: 'none'
        }

    return (
      <div className={className || ''} style={containerStyle} ref={containerRef}>
        <ResponsiveLine
          data={data}
          enableArea={true}
          useMesh={data.some((serie) => serie.data.length > 0)} // if no data, we cannot use mesh as it will throw an error upon hover
          enableGridX={false} // always false, as the timeTicksLayer is used to draw the grid
          animate={true}
          enableCrosshair={true}
          enableTouchCrosshair={true}
          isInteractive={true}
          onTouchStart={(_, event) => attrs.onTouchStart(event)}
          onTouchEnd={(_, event) => attrs.onTouchEnd(event)}
          areaOpacity={0.2}
          margin={mergedConfig.margin}
          xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%SZ', useUTC: true }}
          xFormat="time:%Y-%m-%d %H:%M:%S"
          yScale={
            {
              ...mergedConfig.yScale,
              min: 'auto',
              max: mergedConfig.yScale.max === 'auto' ? getMaxValue(data) * 1.01 : Number(mergedConfig.yScale.max),
              nice: true,
              clamp: true
            } as ScaleSpec
          }
          yFormat={mergedConfig.tooltipConfig.yFormat}
          axisBottom={{ ...mergedConfig.axisBottom, tickValues: 0 }}
          curve={curve}
          // Gradient from https://nivo.rocks/storybook/?path=/docs/line--docs
          defs={[
            {
              colors: [
                {
                  color: 'inherit',
                  offset: 0
                },
                {
                  color: 'inherit',
                  offset: 100,
                  opacity: 0
                }
              ],
              id: 'gradient',
              type: 'linearGradient'
            }
          ]}
          fill={[
            {
              id: 'gradient',
              match: '*'
            }
          ]}
          axisLeft={{
            ...mergedConfig.axisLeft,
            tickValues: tickValues
          }}
          layers={[
            (props: CustomLayerProps) =>
              timeTicksLayer({
                xScale: props.xScale,
                data: data[0] ? data[0].data : [],
                isDarkMode,
                width: props.innerWidth,
                height: props.innerHeight,
                enableGridX: mergedConfig.enableGridX
              }),
            'grid',
            'axes',
            'lines',
            'crosshair',
            'points',
            'areas',
            'mesh' // must be last for tooltip to work
            // TODO: maybe use slices instead
            // TODO: add legends
          ]}
          pointSize={mergedConfig.pointSize}
          pointColor={isDarkMode ? '#ffffff' : '#000000'}
          pointBorderWidth={pointBorderWidth}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-10}
          enableGridY={mergedConfig.enableGridY}
          colors={getColorBlindSchemeWithBW(isDarkMode)}
          theme={isDarkMode ? darkTheme : lightTheme}
          onClick={handlePointClick}
          tooltip={
            tooltip ||
            ((pos: PointTooltipProps) => {
              const pointIdParts = pos.point.id.split(' ')
              const rawInstanceID = pointIdParts.length > 1 ? pointIdParts[1].trim() : ''

              const lastDotIndex = rawInstanceID.lastIndexOf('.')
              const instanceID =
                lastDotIndex !== -1 ? Number(rawInstanceID.substring(0, lastDotIndex)) : Number(rawInstanceID)
              const parameterID = Number(pointIdParts[0].trim())

              const instanceName = getInstanceById(Number(instanceID))?.userIdentifier || 'Unknown'
              const wholeParameter = getParameterByIds(Number(instanceID), parameterID)

              return (
                <ChartToolTip
                  position={pos}
                  containerRef={containerRef as React.RefObject<HTMLDivElement>}
                  instanceName={instanceName}
                  parameterName={wholeParameter?.denotation}
                  xName={mergedConfig.tooltipConfig.xName}
                  yName={mergedConfig.tooltipConfig.yName}
                />
              )
            })
          }
        />
      </div>
    )
  }
)

ResponsiveLineChartBase.displayName = 'ResponsiveLineChartBase'

export const ResponsiveLineChart = memo(ResponsiveLineChartBase)
