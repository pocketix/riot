import { Point } from '@nivo/line'
import { useRef } from 'react'

export function useChartLongPress(
  longPressFn: () => void,
  shortPressFn?: (chartPoint: Point) => void,
  { threshold = 300, moveThreshold = 10 } = {}
) {
  const pressTimer = useRef<NodeJS.Timeout | null>(null)
  const moved = useRef(false)
  const begin = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // nivo needs this style of handlers => PointTouchHandler = (point: Point, event: React.TouchEvent) => void
  const handleTouchStart = (_chartPoint: Point, touchEvent: React.TouchEvent) => {
    moved.current = false // reset
    const touch = touchEvent.touches[0]
    begin.current = { x: touch.clientX, y: touch.clientY }

    // Schedule the long press function immediately
    pressTimer.current = setTimeout(() => {
      if (!moved.current) {
        longPressFn()
      }
    }, threshold)
  }

  const handleTouchMove = (_chartPoint: Point, touchEvent: React.TouchEvent) => {
    const touch = touchEvent.touches[0]
    const dx = Math.abs(touch.clientX - begin.current.x)
    const dy = Math.abs(touch.clientY - begin.current.y)
    if (dx > moveThreshold || dy > moveThreshold) {
      // if the user reaches the deltas, cancel
      moved.current = true
      if (pressTimer.current) {
        clearTimeout(pressTimer.current)
        pressTimer.current = null
      }
    }
  }

  const handleTouchEnd = (chartPoint: Point, touchEvent: React.TouchEvent) => {
    touchEvent.preventDefault() // prevents menu from popping up

    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }

    if (!moved.current && !pressTimer.current && shortPressFn) {
      shortPressFn(chartPoint)
    }
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }
}
