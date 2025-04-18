import { Serie } from '@nivo/line'
import { RefObject } from 'react'
import { ChartCardConfig } from '@/schemas/dashboard/visualizations/LineChartBuilderSchema'
import { ResponsiveLineChart } from '../visualizations/ResponsiveLineChart'
import { BaseCard } from './BaseCard'
import { Skeleton } from '@/components/ui/skeleton'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'

interface ChartCardViewProps extends BaseVisualizationCardProps<ChartCardConfig> {
  data: Serie[]
  chartConfig?: ChartCardConfig
  error: string | null
  isLoading: boolean
  unavailableData: { device: string; parameter: string }[]
  containerRef: RefObject<HTMLDivElement>
}

export const ChartCardView = (props: ChartCardViewProps) => {
  return (
    <BaseCard<ChartCardConfig>
      {...props}
      isLoading={props.isLoading}
      error={props.error}
      visualizationType="line"
      cardTitle={props.chartConfig?.cardTitle}
      configuration={props.chartConfig!}
    >
      <>
        {props.unavailableData?.length > 0 && (
          <div className="absolute right-2 top-0 z-10">
            <Skeleton className="h-full w-fit p-1 pt-0" disableAnimation>
              <ResponsiveTooltip
                content={
                  <div className="flex max-w-28 flex-col">
                    <span className="text-center font-bold text-destructive">No data available</span>
                    {props.unavailableData?.map((row) => (
                      <div key={row.device + row.parameter} className="flex w-full flex-col">
                        <span className="break-words text-center text-xs text-gray-500">Device: {row.device}</span>
                        <span className="break-words text-center text-xs text-gray-500">
                          Parameter: {row.parameter}
                        </span>
                      </div>
                    ))}
                  </div>
                }
              >
                <span className="truncate text-xs font-semibold text-destructive">Unavailable</span>
              </ResponsiveTooltip>
            </Skeleton>
          </div>
        )}
        <ResponsiveLineChart data={props.data} config={props.chartConfig} ref={props.containerRef} />
      </>
    </BaseCard>
  )
}
