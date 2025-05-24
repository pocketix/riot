
import { useRef, useEffect, useState, memo } from 'react'
import { axisBottom } from 'd3-axis'
import { timeFormat } from 'd3-time-format'
import { ScaleTime, scaleTime } from 'd3-scale'
import { select, Selection, pointer } from 'd3-selection'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/components/ChartThemes'
import { Datum } from '@nivo/line'
import { Card } from '@/components/ui/card'
import { Portal } from '@radix-ui/react-portal'
import { getColorBlindSchemeWithBW } from './color-schemes/color-impaired'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { isEqual } from 'lodash'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { cn } from '@/lib/utils'

interface SequentialStatesProps {
  data: readonly Datum[]
  dataInfo?: {
    instanceID?: number
    parameterID?: number
    instanceName: string
    parameterName: string
  }
  disableDetailsOnClick?: boolean
}

interface StateDataSegment {
  startTime: Date
  endTime: Date
  value: string
  color: string
  labelColor: string
}

interface HelpingLine {
  x: number
  date: Date
}

const formatDuration = (millis: number): string => {
  const seconds = Math.floor(millis / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export const SequentialStatesVisualizationBase = ({ data, dataInfo, disableDetailsOnClick }: SequentialStatesProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // stable container to prevent errors
  const stableContainerRef = useRef<SVGGElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const { isDarkMode } = useDarkMode()
  const strokeColor = isDarkMode ? darkTheme.text.fill : lightTheme.text.fill
  const xScaleRef = useRef<ScaleTime<number, number> | null>(null)
  const timelineDataRef = useRef<StateDataSegment[]>([])
  const currentSegmentRef = useRef<StateDataSegment | null>(null)
  const marginRef = useRef({ top: 15, right: 15, bottom: 20, left: 20 })
  const innerHeightRef = useRef(0)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    state: '',
    startTime: '',
    endTime: '',
    duration: '',
    segmentColor: ''
  })

  const [tooltipLine, setTooltipLine] = useState<{
    show: boolean
    x: number | null // x is independent of the tooltip card position
  }>({ show: false, x: null })
  const { setDetailsSelectedDevice } = useDeviceDetail()

  const handleClick = () => {
    if (disableDetailsOnClick) return
    if (dataInfo && dataInfo.instanceID && dataInfo.parameterID) {
      setDetailsSelectedDevice(dataInfo.instanceID, dataInfo.parameterID)
    }
  }

  useEffect(() => {
    if (!containerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return
      const { width, height } = entries[0].contentRect
      setWidth(width)
      setHeight(height)
    })
    resizeObserver.observe(containerRef.current)
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
    }
  }, [])

  // This useEffect redraws the whole chart when the data or width changes
  useEffect(() => {
    if (!stableContainerRef.current || !data || data.length === 0 || width <= 0) {
      return
    }

    const g = select(stableContainerRef.current)
    g.selectAll('*').remove()

    // Increased the 'currentTime' to avoid new states being too small
    const currentTime = new Date(new Date().getTime() + 1000 * 60 * 2)
    const margin = marginRef.current
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    innerHeightRef.current = innerHeight

    if (innerWidth <= 0) return

    const timelineData = processData(data, currentTime)
    timelineDataRef.current = timelineData

    const minTime = timelineData.length > 0 ? timelineData[0].startTime : new Date()

    const xScale = scaleTime().range([0, innerWidth]).nice().domain([minTime, currentTime])
    xScaleRef.current = xScale

    const segmentsGroup = g.append('g').attr('class', 'segments')
    const gridLinesGroup = g.append('g').attr('class', 'grid-lines')
    const axisGroup = g.append('g').attr('class', 'x-axis-container')

    createSegments(segmentsGroup, timelineData, xScale, innerHeight)
    const helpingLines = createBottomAxis(axisGroup, xScale, innerWidth, innerHeight)
    setHelpingLines(gridLinesGroup, helpingLines, innerHeight)
    // Tooltip overlay as the last element to be on top,
    // so that we can catch all events
    addPointerEventOverlay(g, innerWidth, innerHeight)

    // clear D3 group contents, prevents removeChild error
    return () => {
      g.selectAll('*').remove()
    }
  }, [data, width, height, isDarkMode])

  const processData = (data: readonly Datum[], currentTime: Date): StateDataSegment[] => {
    // Set discards duplicates
    const uniqueValues = Array.from(new Set(data.map((d) => String(d.y))))

    if (uniqueValues.length > 8) {
      let colorScheme: string[] = []
      let labelColorScheme: string[] = []
      // if more than 8 colors, alternate between two colors
      if (isDarkMode) {
        colorScheme = ['#ffffff', '#767676']
        labelColorScheme = ['#222222', '#222222']
      } else {
        colorScheme = ['#222222', '#bbbbbb']
        labelColorScheme = ['#ffffff', '#222222']
      }
      // Sort by time, just in case, this caused artefacts in line chart
      const sortedData = [...data].sort((a, b) => new Date(a.x!).getTime() - new Date(b.x!).getTime())
      const combinedSegments: StateDataSegment[] = []
      if (sortedData.length === 0) return []

      let currentSegment = {
        startTime: new Date(sortedData[0].x!),
        value: String(sortedData[0].y)
      }
      let colorIndex = 0

      for (let i = 1; i < sortedData.length; i++) {
        const point = sortedData[i]
        const pointValue = String(point.y)
        const pointTime = new Date(point.x!)

        if (pointValue !== currentSegment.value) {
          const endTime = pointTime
          combinedSegments.push({
            startTime: currentSegment.startTime,
            endTime: endTime,
            value: currentSegment.value,
            color: colorScheme[colorIndex % colorScheme.length],
            labelColor: labelColorScheme[colorIndex % labelColorScheme.length]
          })
          colorIndex++
          currentSegment = {
            startTime: pointTime,
            value: pointValue
          }
        }
      }
      // Last segment
      combinedSegments.push({
        startTime: currentSegment.startTime,
        endTime: currentTime,
        value: currentSegment.value,
        color: colorScheme[colorIndex % colorScheme.length],
        labelColor: labelColorScheme[colorIndex % labelColorScheme.length]
      })
      return combinedSegments
    } else {
      const colorScheme = getColorBlindSchemeWithBW(isDarkMode)
      const labelColorScheme = Array(colorScheme.length).fill(strokeColor)
      const valueColorMap: Record<string, string> = {}
      const valueLabelColorMap: Record<string, string> = {}

      uniqueValues.forEach((value, i) => {
        valueColorMap[value] = colorScheme[i % colorScheme.length]
        valueLabelColorMap[value] = labelColorScheme[i % labelColorScheme.length]
      })

      const sortedData = [...data].sort((a, b) => new Date(a.x!).getTime() - new Date(b.x!).getTime())
      const combinedSegments: StateDataSegment[] = []
      if (sortedData.length === 0) return []

      let currentSegment = {
        startTime: new Date(sortedData[0].x!),
        value: String(sortedData[0].y)
      }

      for (let i = 1; i < sortedData.length; i++) {
        const point = sortedData[i]
        const pointValue = String(point.y)
        const pointTime = new Date(point.x!)

        if (pointValue !== currentSegment.value) {
          const endTime = pointTime
          combinedSegments.push({
            startTime: currentSegment.startTime,
            endTime: endTime,
            value: currentSegment.value,
            color: valueColorMap[currentSegment.value],
            labelColor: valueLabelColorMap[currentSegment.value]
          })
          currentSegment = {
            startTime: pointTime,
            value: pointValue
          }
        }
      }
      // Last segment
      combinedSegments.push({
        startTime: currentSegment.startTime,
        endTime: currentTime,
        value: currentSegment.value,
        color: valueColorMap[currentSegment.value],
        labelColor: valueLabelColorMap[currentSegment.value]
      })
      return combinedSegments
    }
  }

  const createSegments = (
    g: Selection<SVGGElement, unknown, null, undefined>,
    data: StateDataSegment[],
    xScale: ScaleTime<number, number>,
    height: number
  ) => {
    const segmentGroups = g.selectAll('.segment-group').data(data).enter().append('g').attr('class', 'segment-group')

    segmentGroups
      .append('rect')
      .attr('class', 'segment')
      .attr('x', (d) => xScale(d.startTime))
      .attr('width', (d) => Math.max(5, xScale(d.endTime) - xScale(d.startTime)))
      .attr('y', function () {
        const width = parseFloat(this.getAttribute('width') || '0')
        return width <= 10 ? -10 : 0
      })
      .attr('height', function () {
        const y = parseFloat(this.getAttribute('y') || '0')
        return y === -10 ? height + 10 : height
      })
      .attr('fill', (d) => d.color)
      .style('pointer-events', 'none')

    segmentGroups
      .append('text')
      .attr('class', 'segment-label')
      .attr('x', (d) => xScale(d.startTime) + (xScale(d.endTime) - xScale(d.startTime)) / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', (d) => d.labelColor)
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .style('font-weight', 'bold')
      .text((d) => {
        const cellWidth = xScale(d.endTime) - xScale(d.startTime)
        const textWidth = d.value.length * 6
        if (textWidth > cellWidth - 10) {
          const maxChars = Math.floor((cellWidth - 10) / 6)
          return maxChars > 2 ? `${d.value.substring(0, maxChars - 3)}...` : ''
        }
        return d.value
      })
  }

  const createBottomAxis = (
    axisGroup: Selection<SVGGElement, unknown, null, undefined>,
    xScale: ScaleTime<number, number>,
    width: number,
    height: number
  ): HelpingLine[] => {
    const xAxis = axisBottom(xScale)
      .tickSizeOuter(3)
      .tickFormat((d) => {
        const date = new Date(d as Date)
        if (date.getHours() === 0 && date.getMinutes() === 0) {
          return timeFormat('%a %d')(date)
        }
        return timeFormat('%H:%M')(date)
      })
      .ticks(Math.max(2, Math.floor(width / 75))) // one tick per 75px

    const xAxisRenderedGroup = axisGroup
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .style('font-size', isDarkMode ? darkTheme.axis.ticks.text.fontSize : lightTheme.axis.ticks.text.fontSize)

    xAxisRenderedGroup
      .select('.domain')
      .style('stroke', isDarkMode ? darkTheme.axis.domain.line.stroke : lightTheme.axis.domain.line.stroke)
      .style(
        'stroke-width',
        isDarkMode ? darkTheme.axis.domain.line.strokeWidth : lightTheme.axis.domain.line.strokeWidth
      )

    xAxisRenderedGroup
      .selectAll('.tick-line')
      .style('stroke', isDarkMode ? darkTheme.axis.ticks.line.stroke : lightTheme.axis.ticks.line.stroke)
      .style(
        'stroke-width',
        isDarkMode ? darkTheme.axis.ticks.line.strokeWidth : lightTheme.axis.ticks.line.strokeWidth
      )

    const helpingLines: HelpingLine[] = []
    const ticks = xAxisRenderedGroup.selectAll('.tick')
    ticks.each(function (d) {
      const tick = select(this)
      const date = new Date(d as Date)
      const tickX = xScale(date)
      const text = tick.select('text')
      text.style('fill', strokeColor)

      if (date.getHours() === 0 && date.getMinutes() === 0) {
        text.style('font-weight', 'bold')
        helpingLines.push({ x: tickX, date })
      } else {
        text.style('fill', strokeColor)
      }
    })
    return helpingLines
  }

  const setHelpingLines = (
    g: Selection<SVGGElement, unknown, null, undefined>,
    helpingLines: HelpingLine[],
    height: number
  ) => {
    g.selectAll('.grid-line').remove()
    helpingLines.forEach((line) => {
      g.append('line')
        .attr('class', `grid-line`)
        .attr('x1', line.x + 0.5)
        .attr('x2', line.x + 0.5)
        .attr('y1', -15)
        .attr('y2', height)
        .style('stroke', strokeColor)
        .style('stroke-width', 1.5)
        .style('pointer-events', 'none')
    })
  }

  const findSegmentForDate = (targetDate: Date): StateDataSegment | null => {
    if (!timelineDataRef.current) return null
    return (
      timelineDataRef.current.find((segment) => targetDate >= segment.startTime && targetDate < segment.endTime) || null
    )
  }

  const showOrUpdateTooltip = (
    event: PointerEvent | MouseEvent | TouchEvent,
    segmentData: StateDataSegment,
    pointerX: number
  ) => {
    if (!tooltipRef.current || !containerRef.current) return

    const pageX = 'touches' in event ? event.touches[0].pageX : (event as PointerEvent | MouseEvent).pageX
    const pageY = 'touches' in event ? event.touches[0].pageY : (event as PointerEvent | MouseEvent).pageY

    const formattedStart = segmentData.startTime.toLocaleString()
    const now = new Date()
    // The increased xAxis time range causes the end time to be in the future
    const safeEndTime = segmentData.endTime > now ? now : segmentData.endTime
    const formattedEnd = safeEndTime.toLocaleString()
    const duration = formatDuration(safeEndTime.getTime() - segmentData.startTime.getTime())

    const tooltipWidth = tooltipRef.current.offsetWidth
    const tooltipHeight = tooltipRef.current.offsetHeight
    const containerRect = containerRef.current.getBoundingClientRect()
    const offset = 15

    let x = pageX + offset
    if (x + tooltipWidth > containerRect.right) {
      x = pageX - tooltipWidth - offset
    }
    if (x < containerRect.left) {
      x = containerRect.left
    }

    let y = pageY + offset
    if (y + tooltipHeight > window.innerHeight) {
      y = pageY - tooltipHeight - offset
    }
    if (y < 0) {
      y = 0
    }

    setTooltip({
      show: true,
      x,
      y,
      state: segmentData.value,
      startTime: formattedStart,
      endTime: formattedEnd,
      duration: duration,
      segmentColor: segmentData.color
    })

    setTooltipLine({ show: true, x: pointerX })
  }

  const hideTooltip = () => {
    currentSegmentRef.current = null
    setTooltip((prev) => ({ ...prev, show: false }))
    setTooltipLine({ show: false, x: null })
  }

  const handlePointerLeave = (event: PointerEvent) => {
    // Prevent defaults should stop the screen from scrolling
    event.preventDefault()
    hideTooltip()
  }

  const handlePointerUp = (event: PointerEvent) => {
    event.preventDefault()
    hideTooltip()
  }

  // tooltip overlay to capture pointer
  const addPointerEventOverlay = (
    g: Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number
  ) => {
    const handlePointerEvent = (event: PointerEvent) => {
      event.preventDefault()
      if (!xScaleRef.current) return

      const [pointerX] = pointer(event, g.node())
      const clampedX = Math.max(0, Math.min(width, pointerX))
      const targetDate = xScaleRef.current.invert(clampedX)
      const segment = findSegmentForDate(targetDate)

      if (segment) {
        const previousSegment = currentSegmentRef.current
        if (
          !previousSegment ||
          segment.startTime.getTime() !== previousSegment.startTime.getTime() ||
          segment.value !== previousSegment.value
        ) {
          currentSegmentRef.current = segment
          showOrUpdateTooltip(event, segment, clampedX)
        } else {
          showOrUpdateTooltip(event, segment, clampedX)
        }
      } else {
        hideTooltip()
      }
    }

    g.append('rect')
      .attr('class', 'pointer-overlay')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      // 3 attributes below prevent text selection, tested on Safari and Chrome
      .style('user-select', 'none')
      .style('-webkit-user-select', 'none')
      .style('-webkit-touch-callout', 'none')
      .on('pointerdown', handlePointerEvent)
      .on('pointermove', handlePointerEvent)
      .on('pointerleave', handlePointerLeave)
      .on('pointerup', handlePointerUp)
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg
        ref={svgRef}
        className={cn('block w-full overflow-visible', disableDetailsOnClick ? '' : 'cursor-pointer')}
        width={width}
        height={height}
        style={{ touchAction: 'none' }}
        onClick={handleClick}
      >
        <g ref={stableContainerRef} transform={`translate(${marginRef.current.left},${marginRef.current.top})`} />

        {tooltipLine.show && tooltipLine.x !== null && (
          <g
            transform={`translate(${marginRef.current.left},${marginRef.current.top})`}
            style={{ pointerEvents: 'none' }}
          >
            <line
              className="indicator-line"
              x1={tooltipLine.x}
              y1={-15}
              x2={tooltipLine.x}
              y2={innerHeightRef.current + 10}
              stroke={strokeColor}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </g>
        )}
      </svg>

      {/* When this was used in a separate return, the visualization was not rendering if the data came afterwards */}
      {(!data || data.length === 0) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <ResponsiveTooltip
            content={
              <div className="flex flex-col">
                <span className="text-center font-bold text-destructive">No data available</span>
                {dataInfo && (
                  <div className="flex w-full flex-col">
                    <span className="break-words text-center text-xs">Device: {dataInfo.instanceName}</span>
                    <span className="break-words text-center text-xs">Parameter: {dataInfo.parameterName}</span>
                  </div>
                )}
              </div>
            }
            className="h-full w-full"
          >
            <Skeleton className="flex h-full w-full items-center justify-center">
              <span className="truncate font-semibold text-destructive">No data available</span>
            </Skeleton>
          </ResponsiveTooltip>
        </div>
      )}

      {/* Using portal, as when this visualization gets displayed in a drawer, the tooltip was not visible */}
      <Portal>
        <Card
          ref={tooltipRef}
          className={`fixed z-50 max-w-[250px] rounded-md border p-2 text-sm text-primary shadow-lg ${
            tooltip.show ? 'visible opacity-100' : 'invisible opacity-0'
          }`}
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            pointerEvents: 'none'
          }}
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: tooltip.segmentColor }} />
            <div className="font-bold transition-all duration-300 ease-in-out">{tooltip.state}</div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xs font-bold">{dataInfo?.instanceName}</span>
            <span className="text-xs font-bold">{dataInfo?.parameterName}</span>
          </div>
          <div className="text-xs">
            <b>Start:</b> {tooltip.startTime}
          </div>
          <div className="text-xs">
            <b>End:</b> {tooltip.endTime}
          </div>
          <div className="text-xs">
            <b>Duration:</b> {tooltip.duration}
          </div>
        </Card>
      </Portal>
    </div>
  )
}

export const SequentialStatesVisualization = memo(SequentialStatesVisualizationBase, isEqual)
