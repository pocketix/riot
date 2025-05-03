// inspired by : https://github.com/react-grid-layout/react-grid-layout/issues/1306

import { Layout, utils } from 'react-grid-layout'

type Direction = 'left' | 'right' | 'up' | 'down' | 'widthminus' | 'widthplus' | 'heightminus' | 'heightplus'

export const moveWidget = (layout: Layout[], id: string, direction: Direction, cols: number): Layout[] => {
  const cl: Layout[] = utils.cloneLayout(layout)

  const item = cl.find((item) => item.i === id)
  if (!item) {
    console.warn(`Item with id "${id}" not found in layout.`)
    return layout
  }

  if (
    direction === 'widthplus' ||
    direction === 'heightplus' ||
    direction === 'widthminus' ||
    direction === 'heightminus'
  ) {
    switch (direction) {
      case 'widthplus':
        item.w = Math.min(item.w + 1, cols - item.x)
        break
      case 'heightplus':
        item.h = item.h + 1
        break
      case 'widthminus':
        item.w = Math.max(item.w - 1, 1)
        break
      case 'heightminus':
        item.h = Math.max(item.h - 1, 1)
        break
    }
    return cl
  }

  const oldX = item.x
  const oldY = item.y

  const newX = oldX + (direction === 'right' ? 1 : direction === 'left' ? -1 : 0)
  var newY = oldY + (direction === 'down' ? 1 : direction === 'up' ? -1 : 0)

  const mockItem = { ...item, x: newX, y: newY }
  var collision: Layout | undefined

  // Based on the collision, we must adjust the y position based on the collision's height
  if (direction === 'down' || direction === 'up') {
    collision = utils.getFirstCollision(cl, mockItem)
    if (collision) {
      if (direction === 'up') {
        newY = collision.y
      } else {
        newY = collision.y + collision.h
      }
    }
  }

  if (newX < 0 || newY < 0 || newX + item.w > cols) {
    return layout
  }

  const nl = utils.compact(
    utils.moveElement(cl, item, newX, newY, true, false, 'vertical', cols, false),
    'vertical',
    cols
  )

  const newItem = nl.find((item) => item.i === id)

  if (oldX !== newItem?.x || oldY !== newItem?.y) {
    // item moved
    return nl
  }

  // nothing changed
  return nl
}
