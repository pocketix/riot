import { ChartCardConfig } from '@/schemas/dashboard/visualizations/LineChartBuilderSchema'
import { BulletCardConfig } from '@/schemas/dashboard/visualizations/BulletChartBuilderSchema'
import { EntityCardConfig } from '@/schemas/dashboard/visualizations/EntityCardBuilderSchema'
import { TableCardConfig } from '@/schemas/dashboard/visualizations/TableBuilderSchema'
import { SwitchCardConfig } from '@/schemas/dashboard/visualizations/SwitchBuilderSchema'

export type AllConfigTypes = ChartCardConfig | BulletCardConfig | EntityCardConfig | TableCardConfig | SwitchCardConfig

export type GridItem<ConfigType extends AllConfigTypes> = {
  layoutID?: string
  visualization: 'line' | 'switch' | 'table' | 'bullet' | 'entitycard'
  visualizationConfig: BuilderResult<ConfigType>
}

export type BuilderResult<ConfigType extends AllConfigTypes> = {
  config: ConfigType
  sizing?: Sizing
}

export type Sizing = {
  w?: number
  h?: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}
