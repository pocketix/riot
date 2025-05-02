import { SequentialStatesCardConfig } from '@/schemas/dashboard/visualizations/SequentialStatesBuilderSchema'
import { BaseCard } from './BaseCard'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { SequentialStatesVisualization } from '../devices/components/SequentialStatesVisualization'
import { Datum } from '@nivo/line'

interface SequentialStatesCardViewProps extends BaseVisualizationCardProps<SequentialStatesCardConfig> {
  data: Datum[]
  cardConfig?: SequentialStatesCardConfig
  error: string | null
  isLoading: boolean
  dataInfo: { instanceName: string; parameterName: string }
}

export const SequentialStatesCardView = (props: SequentialStatesCardViewProps) => {
  return (
    <BaseCard<SequentialStatesCardConfig>
      {...props}
      isLoading={props.isLoading}
      error={props.error}
      visualizationType="seqstates"
      cardTitle={props.cardConfig?.title}
      cardIcon={props.cardConfig?.icon}
      configuration={props.cardConfig!}
    >
      <div className="h-full w-full">
        <SequentialStatesVisualization data={props.data} dataInfo={props.dataInfo} />
      </div>
    </BaseCard>
  )
}
