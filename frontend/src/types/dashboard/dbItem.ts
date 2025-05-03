import { AllConfigTypes, VisualizationTypes } from './gridItem'

export type SpecificDBItemDetails<ConfigType extends AllConfigTypes> = {
  visualization: VisualizationTypes
  visualizationConfig: ConfigType
}
