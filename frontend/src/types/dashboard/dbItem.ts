import { AllConfigTypes } from './gridItem'

export type SpecificDBItemDetails<ConfigType extends AllConfigTypes> = {
  visualization: 'line' | 'switch' | 'table' | 'bullet' | 'entitycard'
  visualizationConfig: ConfigType
}
