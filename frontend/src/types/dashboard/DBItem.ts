import { AllConfigTypes } from './GridItem'

export type DBItemDetails<ConfigType extends AllConfigTypes> = {
  layoutID?: string
  visualization: 'line' | 'switch' | 'table' | 'bullet' | 'entitycard'
  visualizationConfig: ConfigType
}
