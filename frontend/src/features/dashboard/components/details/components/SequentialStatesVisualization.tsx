// Inspired by https://github.com/denisemauldin/d3-timeline
import { useRef, useEffect, useState } from 'react'
import { axisBottom } from 'd3-axis'
import { timeFormat } from 'd3-time-format'
import { ScaleTime, scaleTime } from 'd3-scale'
import { select, Selection } from 'd3-selection'
import { schemeCategory10 } from 'd3'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../../cards/components/ChartThemes'

export interface SingleStatePoint {
  time: string
  value: string
}

interface SequentialStatesProps {
  data: SingleStatePoint[]
}

interface StateDataSegment {
  startTime: Date
  endTime: Date
  value: string
  duration: number
  color: string
}

interface HelpingLine {
  x: number
  type: 'day' | 'week' | 'month'
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

export const SequentialStatesVisualization = ({ data }: SequentialStatesProps) => {
  const height = 70
  const containerRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const { isDarkMode } = useDarkMode()
  const strokeColor = isDarkMode ? darkTheme.text.fill : lightTheme.text.fill
  const [width, setWidth] = useState(0)
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    state: '',
    startTime: '',
    endTime: '',
    duration: ''
  })

  // Using observer, as using keepAspectRatio prop on svg does not produce the
  // wanted bahviour and it becomes unreadable
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0) return
      const { width } = entries[0].contentRect
      setWidth(width)
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
    if (!svgRef.current || !data || data.length === 0 || width === 0) return

    // Clear any existing chart
    select(svgRef.current).selectAll('*').remove()

    const currentTime = new Date()
    const margin = { top: 30, right: 20, bottom: 20, left: 20 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const svg = select(svgRef.current)
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const timelineData = processData(data, currentTime)

    // Create the bottom axis
    const minTime = timelineData[0].startTime
    const xScale = scaleTime().domain([minTime, currentTime]).range([0, innerWidth])

    const segmentsGroup = g.append('g').attr('class', 'segments')
    const gridLinesGroup = g.append('g').attr('class', 'grid-lines')

    createSegments(segmentsGroup, timelineData, xScale, innerHeight)

    const helpingLines = createBottomAxis(g, xScale, innerWidth, innerHeight)

    setHelpingLines(gridLinesGroup, helpingLines, innerHeight)
  }, [data, width])

  const processData = (data: SingleStatePoint[], currentTime: Date): StateDataSegment[] => {
    const valueColorMap: Record<string, string> = {}
    // Set discards duplicates
    const uniqueValues = Array.from(new Set(data.map((d) => d.value)))

    // Sort by time, it already should be sorted, but just in case
    const sortedData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

    // Color the values
    if (uniqueValues.length > 10) {
      // This will be handled by black and white colors
      console.warn('More than 10 unique values, some colors will be repeated')
    }
    uniqueValues.forEach((value, i) => {
      valueColorMap[value] = schemeCategory10[i % schemeCategory10.length]
    })

    console.log('Sorted data', sortedData)

    // Calculate time spans
    return sortedData.map((point, i) => {
      const startTime = new Date(point.time)

      let endTime: Date
      if (i < sortedData.length - 1) {
        const nextPointTime = new Date(sortedData[i + 1].time)
        endTime = nextPointTime <= currentTime ? nextPointTime : currentTime
      } else {
        endTime = currentTime
      }

      return {
        startTime,
        endTime,
        value: point.value,
        duration: endTime.getTime() - startTime.getTime(),
        color: valueColorMap[point.value],
        originalPoint: point
      }
    })
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
      .attr('width', (d) => Math.max(1, xScale(d.endTime) - xScale(d.startTime)))
      .attr('y', function () {
        const width = parseFloat(this.getAttribute('width') || '0')
        return width <= 10 ? -10 : 0
      })
      .attr('height', function () {
        const y = parseFloat(this.getAttribute('y') || '0')
        return y === -10 ? height + 10 : height
      })
      .attr('fill', (d) => d.color)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        const formattedStart = d.startTime.toLocaleString()
        const formattedEnd = d.endTime.toLocaleString()
        const duration = formatDuration(d.duration)
        const x = event.pageX
        const y = event.pageY

        setTooltip({
          show: true,
          x,
          y,
          state: d.value,
          startTime: formattedStart,
          endTime: formattedEnd,
          duration: duration
        })
      })
      .on('mousemove', (event) => {
        if (!containerRef.current) return
        if (!tooltipRef.current) return

        const containerRect = containerRef.current.getBoundingClientRect()
        const tooltipWidth = 250

        let x = event.pageX + 10
        let y = event.pageY + 10

        if (x + tooltipWidth > containerRect.right) {
          x = event.pageX - tooltipRef.current.offsetWidth - 10
        }

        setTooltip((prev) => ({
          ...prev,
          x,
          y
        }))
      })
      .on('mouseout', () => {
        const tooltip = tooltipRef.current
        setTooltip({
          show: false,
          x: tooltip ? tooltip.offsetLeft : 0,
          y: tooltip ? tooltip.offsetTop : 0,
          state: '',
          startTime: '',
          endTime: '',
          duration: ''
        })
      })

    segmentGroups
      .append('text')
      .attr('class', 'segment-label')
      .attr('x', (d) => xScale(d.startTime) + (xScale(d.endTime) - xScale(d.startTime)) / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', strokeColor)
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .text((d) => {
        const cellWidth = xScale(d.endTime) - xScale(d.startTime)
        const textWidth = d.value.length * 6

        if (textWidth > cellWidth - 10) {
          const maxChars = Math.floor((cellWidth - 10) / 6)
          return maxChars > 3 ? `${d.value.substring(0, maxChars - 3)}...` : ''
        }

        return d.value
      })
  }

  const createBottomAxis = (
    g: Selection<SVGGElement, unknown, null, undefined>,
    xScale: ScaleTime<number, number>,
    width: number,
    height: number
  ) => {
    const xAxis = axisBottom(xScale)
      .tickSizeOuter(3)
      .tickFormat((d) => {
        const date = new Date(d as Date)

        if (date.getHours() === 0 && date.getMinutes() === 0) {
          if (date.getDate() === 1) {
            return timeFormat('%b %d')(date)
          } else if (date.getDay() === 0) {
            return timeFormat('%a %d')(date)
          } else {
            return timeFormat('%a %d')(date)
          }
        }
        return timeFormat('%H:%M')(date)
      })
      .ticks(width > 1000 ? 15 : width > 700 ? 10 : width > 500 ? 7 : width > 300 ? 5 : 3)

    const xAxisGroup = g
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .style('font-size', isDarkMode ? darkTheme.axis.ticks.text.fontSize : lightTheme.axis.ticks.text.fontSize)

    xAxisGroup
      .select('.domain')
      .style('stroke', isDarkMode ? darkTheme.axis.domain.line.stroke : lightTheme.axis.domain.line.stroke)
      .style(
        'stroke-width',
        isDarkMode ? darkTheme.axis.domain.line.strokeWidth : lightTheme.axis.domain.line.strokeWidth
      )

    xAxisGroup
      .selectAll('.tick line')
      .style('stroke', isDarkMode ? darkTheme.axis.ticks.line.stroke : lightTheme.axis.ticks.line.stroke)
      .style(
        'stroke-width',
        isDarkMode ? darkTheme.axis.ticks.line.strokeWidth : lightTheme.axis.ticks.line.strokeWidth
      )

    const helpingLines: HelpingLine[] = []

    const ticks = xAxisGroup.selectAll('.tick')
    ticks.each(function (d) {
      const tick = select(this)
      const date = new Date(d as Date)
      const tickX = xScale(date)

      if (date.getHours() === 0 && date.getMinutes() === 0) {
        if (date.getDate() === 1) {
          tick.select('text').style('font-weight', 'bold').style('fill', strokeColor)
          helpingLines.push({ x: tickX, type: 'month', date })
        } else if (date.getDay() === 0) {
          tick.select('text').style('font-weight', 'bold').style('fill', strokeColor)
          helpingLines.push({ x: tickX, type: 'week', date })
        } else {
          tick.select('text').style('font-weight', 'bold')
          helpingLines.push({ x: tickX, type: 'day', date })
        }
      }
    })
    return helpingLines
  }

  const setHelpingLines = (
    g: Selection<SVGGElement, unknown, null, undefined>,
    helpingLines: HelpingLine[],
    height: number
  ) => {
    helpingLines.forEach((line) => {
      let strokeWidth, strokeOpacity

      switch (line.type) {
        case 'month':
          strokeWidth = 3
          strokeOpacity = 1
          break
        case 'week':
          strokeWidth = 2
          strokeOpacity = 1
          break
        default:
          strokeWidth = 1
          strokeOpacity = 1
      }

      g.append('line')
        .attr('class', `${line.type}-line`)
        .attr('x1', line.x)
        .attr('x2', line.x)
        .attr('y1', -10)
        .attr('y2', height + 5)
        .style('stroke', strokeColor)
        .style('stroke-width', strokeWidth)
        .style('opacity', strokeOpacity)
    })
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} className="block w-full overflow-hidden" width={width} height={height} />
      <div
        ref={tooltipRef}
        className="fixed z-50 max-w-[250px] rounded-md border border-gray-300 bg-secondary text-primary shadow-md"
        style={{
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          opacity: tooltip.show ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          pointerEvents: tooltip.show ? 'auto' : 'none'
        }}
      >
        <div className="p-2 text-sm">
          <div className="font-bold">{tooltip.state}</div>
          <div>Start: {tooltip.startTime}</div>
          <div>End: {tooltip.endTime}</div>
          <div>Duration: {tooltip.duration}</div>
        </div>
      </div>
    </div>
  )
}
