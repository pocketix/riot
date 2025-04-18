import { BulletCardConfig } from '@/schemas/dashboard/visualizations/BulletChartBuilderSchema'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { BaseCard } from './BaseCard'
import { BulletRow } from './components/BulletRow'
import { BulletRowData } from './BulletCardController'

interface BulletCardViewProps extends BaseVisualizationCardProps<BulletCardConfig> {
  chartConfig?: BulletCardConfig
  data: BulletRowData[]
  error: string | null
  isLoading: boolean
}

export const BulletCardView = (props: BulletCardViewProps) => {
  return (
    <BaseCard<BulletCardConfig>
      {...props}
      isLoading={props.isLoading}
      error={props.error}
      visualizationType="bullet"
      cardTitle={props.chartConfig?.cardTitle}
      configuration={props.chartConfig!}
    >
      <div className="flex h-full w-full flex-col justify-evenly gap-1">
        {props.chartConfig?.rows?.map((row, index) => {
          if (row.config.function === 'last') {
            return (
              <div key={index} className="h-full w-full overflow-hidden">
                <BulletRow key={index} row={row} editModeEnabled={props.editModeEnabled} />
              </div>
            )
          }

          const rowData = props.data.find((d) => d.rowIndex === index)
          return (
            <BulletRow
              key={index}
              row={row}
              aggregatedData={rowData?.data}
              aggregateUpdatedAt={rowData?.updatedAt}
              editModeEnabled={props.editModeEnabled}
            />
          )
        })}
      </div>
    </BaseCard>
  )
}
