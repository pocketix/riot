import { ScaleTime, timeFormat } from 'd3'
import { useMemo } from 'react'
import { Datum, Serie } from '@nivo/line'
import { scaleTime } from 'd3-scale'
import { darkTheme, lightTheme } from '../../cards/components/ChartThemes'

interface timeTicksLayerProps {
  xScale: ScaleTime<number, number>
  width: number
  height: number
  data: readonly Datum[]
  isDarkMode: boolean
  enableGridX: boolean
}

const timeTicksCache = new Map<string, Date[]>()

export const timeTicksLayer = ({ xScale, height, width, data, isDarkMode, enableGridX }: timeTicksLayerProps) => {
  const [minRange, maxRange] = xScale.range()

  const startDate = new Date(data[0]?.x!)
  const endDate = new Date(data[data.length - 1]?.x!)

  const cacheKey = `${startDate.getTime()}-${endDate.getTime()}-${minRange}-${maxRange}-${width}`

  // caching as this layer is retriggerd on each tooltip hover
  const timeTicks = useMemo(() => {
    if (timeTicksCache.has(cacheKey)) {
      return timeTicksCache.get(cacheKey)!
    }

    if (!data.length) {
      return []
    }

    const availableWidth = maxRange - minRange

    // tick every 50 pixels
    const widthTickCount = Math.max(2, Math.floor(availableWidth / 70))

    // .nice makes sure that the ticks are rounded to nice values,
    // the highlighting of midnight rellies on this
    const scale = scaleTime().domain([startDate, endDate]).nice(widthTickCount)

    const visibleTicks = scale.ticks(widthTickCount).filter((date) => {
      const pos = xScale(date)
      return pos >= minRange && pos <= maxRange
    })

    if (visibleTicks[0].getMonth() !== visibleTicks[visibleTicks.length - 1].getMonth()) {
      // if not all the ticks are within the same month,
      // D3 displays the last day of the first month and the first day of the second month
      // only keep the first day of the second month in these cases

      for (let i = 0; i < visibleTicks.length - 1; i++) {
        const currentDate = visibleTicks[i]
        const nextDate = visibleTicks[i + 1]

        if (
          currentDate.getDate() === new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() &&
          nextDate.getDate() === 1
        ) {
          if (currentDate.getMonth() !== nextDate.getMonth()) {
            visibleTicks.splice(i, 1)
            i--
          }
        }
      }
    }

    timeTicksCache.set(cacheKey, visibleTicks)
    return visibleTicks
  }, [cacheKey, startDate, endDate, xScale, minRange, maxRange, width])

  return (
    <g>
      {timeTicks.map((date, i) => {
        const x = xScale(date)

        return (
          <g key={`xAxis-highlighted-${date.getTime()}-${i}`} transform={`translate(${x}, 0)`}>
            <line
              x1={0}
              x2={0}
              y1={height}
              y2={height + 5}
              stroke={isDarkMode ? darkTheme.axis.ticks.line.stroke : lightTheme.axis.ticks.line.stroke}
              strokeWidth={isDarkMode ? darkTheme.axis.ticks.line.strokeWidth : lightTheme.axis.ticks.line.strokeWidth}
            />
            {enableGridX && (
              <line
                x1={0}
                x2={0}
                y1={0}
                y2={height}
                stroke={isDarkMode ? darkTheme.grid.line.stroke : lightTheme.grid.line.stroke}
                strokeWidth={isDarkMode ? darkTheme.grid.line.strokeWidth : lightTheme.grid.line.strokeWidth}
              />
            )}
            {date.getHours() === 0 && date.getMinutes() === 0 ? (
              <>
                <line
                  x1={0}
                  x2={0}
                  y1={0}
                  y2={height}
                  stroke={isDarkMode ? darkTheme.axis.ticks.text.fill : lightTheme.axis.ticks.text.fill}
                  strokeWidth={1}
                  strokeDasharray="3,2"
                />
                <text
                  style={{
                    fontSize: isDarkMode ? darkTheme.axis.ticks.text.fontSize : lightTheme.axis.ticks.text.fontSize,
                    textAnchor: 'middle',
                    fill: isDarkMode ? darkTheme.axis.ticks.text.fill : lightTheme.axis.ticks.text.fill,
                    fontWeight: date.getDate() === 1 ? '800' : '600',
                    fontFamily: 'sans-serif'
                  }}
                  y={height + 16}
                >
                  {timeFormat('%b %d')(date)}
                </text>
              </>
            ) : (
              <text
                style={{
                  fontSize: isDarkMode ? darkTheme.axis.ticks.text.fontSize : lightTheme.axis.ticks.text.fontSize,
                  textAnchor: 'middle',
                  fill: isDarkMode ? darkTheme.axis.ticks.text.fill : lightTheme.axis.ticks.text.fill,
                  fontFamily: 'sans-serif'
                }}
                y={height + 16}
              >
                {timeFormat('%H:%M')(date)}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

export const getMaxValue = (data: Serie[]) => {
  let max = 0
  data.forEach((serie) => {
    serie.data.forEach((datum) => {
      if (datum.y !== null && Number(datum.y) > max) {
        max = Number(datum.y)
      }
    })
  })

  return max
}
