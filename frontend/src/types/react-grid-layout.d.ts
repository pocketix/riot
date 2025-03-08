// src/types/react-grid-layout.d.ts

import { Layout, CompactType } from 'react-grid-layout'

declare module 'react-grid-layout' {
  export const utils: {
    moveElement(layout: Layout[], l: Layout, x?: number, y?: number, isUserAction?: boolean, preventCollision?: boolean, compactType: CompactType, cols: number, allowOverlap?: boolean): Layout[]

    cloneLayout(layout: Layout[]): Layout[]

    compact(layout: Layout[], compactType: CompactType, cols: number): Layout[]

    getFirstCollision(layout: Layout[], layoutItem: Layout): Layout | undefined
  }
}
