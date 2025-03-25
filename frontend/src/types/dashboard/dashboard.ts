import { Layouts } from 'react-grid-layout'
import { DBItemDetails } from './DBItem'
import { AllConfigTypes } from './GridItem'

export type RiotDashboardConfig = {
  riot: {
    layout: Layouts
    details: { [key: string]: DBItemDetails<AllConfigTypes> }
  }
}
