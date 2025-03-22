import { ChartCardConfig } from '@/schemas/dashboard/LineChartBuilderSchema'
import { BulletCardConfig } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { EntityCardConfig } from '@/schemas/dashboard/EntityCardBuilderSchema'
import { TableCardConfig } from '@/schemas/dashboard/TableBuilderSchema'
import { Sizing } from './CardGeneral'

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
