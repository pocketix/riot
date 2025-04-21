import { TableCardConfig } from '@/schemas/dashboard/visualizations/TableBuilderSchema'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { ResponsiveTable } from '../visualizations/ResponsiveTable'
import { BaseCard } from './BaseCard'
import { TableColumnData } from './TableCardController'

interface TableCardViewProps extends BaseVisualizationCardProps<TableCardConfig> {
  tableConfig?: TableCardConfig
  columnData: TableColumnData[]
  error: string | null
  isLoading: boolean
  onRowClick: (instanceId: number, parameterId: number) => void
}

export const TableCardView = (props: TableCardViewProps) => {
  return (
    <BaseCard<TableCardConfig>
      {...props}
      isLoading={props.isLoading}
      error={props.error}
      visualizationType="table"
      cardTitle={props.tableConfig?.title}
      configuration={props.tableConfig!}
    >
      <ResponsiveTable
        columnData={props.columnData}
        config={props.tableConfig!}
        onRowClick={props.onRowClick}
        className="px-2"
      />
    </BaseCard>
  )
}
