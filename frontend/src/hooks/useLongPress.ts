import { useRef } from 'react'

type TouchType = 'mouse' | 'touch'

// This hook is very similar to the useLineChartLongPress hook, but uses different handlers
export function useLongPress(
  longPressFn: () => void,
  shortPressFn?: () => void,
  { threshold = 300, moveThreshold = 10 } = {}
) {
  const begin = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const moved = useRef<boolean>(false)
  const pressTimer = useRef<NodeJS.Timeout | null>(null)
  // Without last event type,
  // short presses were triggered for both touch and mouse events at the same time
  // The initial value doesnt matter here
  const lastEventType = useRef<TouchType | null>(null)

  const startGeneric = (x: number, y: number, type: TouchType) => {
    moved.current = false
    begin.current = { x, y }
    lastEventType.current = type
    pressTimer.current = setTimeout(() => {
      if (!moved.current) {
        longPressFn()
      }
    }, threshold)
  }

  const moveGeneric = (x: number, y: number) => {
    const dx: number = Math.abs(x - begin.current.x)
    const dy: number = Math.abs(y - begin.current.y)
    if (dx > moveThreshold || dy > moveThreshold) {
      moved.current = true
      if (pressTimer.current) {
        clearTimeout(pressTimer.current)
        pressTimer.current = null
      }
    }
  }

  const endGeneric = (type: TouchType) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    if (!moved.current && !pressTimer.current && shortPressFn && lastEventType.current === type) {
      shortPressFn()
    }
  }

  // Touch
  const handleTouchStart: React.TouchEventHandler = (e) => {
    const touch = e.touches[0]
    startGeneric(touch.clientX, touch.clientY, 'touch')
  }
  const handleTouchMove: React.TouchEventHandler = (e) => {
    const touch = e.touches[0]
    moveGeneric(touch.clientX, touch.clientY)
  }
  const handleTouchEnd: React.TouchEventHandler = () => endGeneric('touch')

  // Mouse
  const handleMouseDown: React.MouseEventHandler = (e) => {
    if (lastEventType.current === 'touch') return
    if (e.button !== 0) return // only react to left mouse button clicks
    startGeneric(e.clientX, e.clientY, 'mouse')
  }
  const handleMouseMove: React.MouseEventHandler = (e) => {
    if (lastEventType.current === 'touch') return
    if (e.button !== 0) return
    moveGeneric(e.clientX, e.clientY)
  }
  const handleMouseUp: React.MouseEventHandler = (e) => {
    if (lastEventType.current === 'touch') return
    if (e.button !== 0) return
    endGeneric('mouse')
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp
  }
}
