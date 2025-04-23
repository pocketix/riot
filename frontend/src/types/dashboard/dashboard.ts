import { Layouts } from 'react-grid-layout'
import { SpecificDBItemDetails } from './dbItem'
import { AllConfigTypes } from './gridItem'

export type RiotDashboardConfig = {
  riot: {
    layout: Layouts
    details: { [key: string]: SpecificDBItemDetails<AllConfigTypes> }
  }
}
