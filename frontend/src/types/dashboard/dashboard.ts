import { Layouts } from 'react-grid-layout'
import { DBItemDetails } from './dbItem'
import { AllConfigTypes } from './gridItem'

export type RiotDashboardConfig = {
  riot: {
    layout: Layouts
    details: { [key: string]: DBItemDetails<AllConfigTypes> }
  }
}
