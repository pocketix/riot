import { EntityCardConfig } from '@/schemas/dashboard/visualizations/EntityCardBuilderSchema'
import { Serie } from '@nivo/line'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { BaseCard } from './BaseCard'
import { ResponsiveEntityTable } from '../visualizations/ResponsiveEntityTable'

interface EntityCardViewProps extends BaseVisualizationCardProps<EntityCardConfig> {
  chartConfig?: EntityCardConfig
  sparklineData: Serie[]
  error: string | null
  isLoading: boolean
}

export const EntityCardView = (props: EntityCardViewProps) => {
  return (
    <BaseCard<EntityCardConfig>
      {...props}
      isLoading={props.isLoading}
      error={props.error}
      visualizationType="entitycard"
      cardTitle={props.chartConfig?.title}
      cardIcon={props.chartConfig?.icon}
      configuration={props.chartConfig!}
    >
      <ResponsiveEntityTable config={props.chartConfig!} sparklineData={props.sparklineData} className="px-2 pt-0" />
    </BaseCard>
  )
}
