import { ChartCardConfig } from '@/schemas/dashboard/LineChartBuilderSchema'
import { BulletCardConfig } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { EntityCardConfig } from '@/schemas/dashboard/EntityCardBuilderSchema'
import { TableCardConfig } from '@/schemas/dashboard/TableBuilderSchema'

export type AllConfigTypes = ChartCardConfig | BulletCardConfig | EntityCardConfig | TableCardConfig

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
