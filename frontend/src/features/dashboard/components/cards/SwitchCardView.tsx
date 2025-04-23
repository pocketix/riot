import { SwitchCardConfig } from '@/schemas/dashboard/visualizations/SwitchBuilderSchema'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { SwitchVisualization } from '../visualizations/SwitchVisualization'
import { BaseCard } from './BaseCard'
import { getCustomizableIcon } from '@/utils/getCustomizableIcon'

interface SwitchCardViewProps extends BaseVisualizationCardProps<SwitchCardConfig> {
  switchConfig?: SwitchCardConfig
  isOn: boolean
  percentage: number | null
  isLoading: boolean
  error: string | null
  errorInfo?: {
    instanceId: number
    parameterId: number
  }
  onPercentualChange: (value: number) => void
  onStateChange: (value: boolean) => void
}

export const SwitchCardView = (props: SwitchCardViewProps) => {
  const iconValue = props.switchConfig?.icon! ?? ''
  const IconComponent = iconValue ? getCustomizableIcon(iconValue) : null
  return (
    <BaseCard<SwitchCardConfig>
      {...props}
      isLoading={props.isLoading}
      error={props.error}
      visualizationType="switch"
      configuration={props.switchConfig!}
    >
      <SwitchVisualization
        isOn={props.isOn}
        percentage={props.percentage}
        icon={IconComponent}
        title={props.switchConfig?.title}
        isLoading={props.isLoading}
        isError={!!props.error}
        booleanInfo={{
          instanceID: props.switchConfig?.booleanSettings.instanceID!,
          parameterID: props.switchConfig?.booleanSettings.parameter.id!
        }}
        className="h-full w-full"
        onPercentualChange={props.onPercentualChange}
        onStateChange={props.onStateChange}
      />
    </BaseCard>
  )
}
