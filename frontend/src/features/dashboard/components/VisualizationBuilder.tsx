import styled from 'styled-components'
import { AllConfigTypes, BuilderResult } from '@/types/dashboard/gridItem'
import { LineChartBuilderController } from './builders/LineChartBuidlerController'
import { BulletChartBuilderController } from './builders/BulletChartBuilderController'
import { EntityCardBuilderController } from './builders/EntityCardBuilderController'
import { TableCardBuilderController } from './builders/TableCardBuilderController'
import { SwitchCardBuilderController } from './builders/SwitchCardBuilderController'
import { SequentialStatesBuilderController } from './builders/SequentialStatesBuilderController'
import { ChartCardConfig } from '@/schemas/dashboard/visualizations/LineChartBuilderSchema'
import { BulletCardConfig } from '@/schemas/dashboard/visualizations/BulletChartBuilderSchema'
import { TableCardConfig } from '@/schemas/dashboard/visualizations/TableBuilderSchema'
import { EntityCardConfig } from '@/schemas/dashboard/visualizations/EntityCardBuilderSchema'
import { SwitchCardConfig } from '@/schemas/dashboard/visualizations/SwitchBuilderSchema'
import { SequentialStatesCardConfig } from '@/schemas/dashboard/visualizations/SequentialStatesBuilderSchema'

export const VisualizationBuilderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  height: fit-content;
`

export interface VisualizationBuilderProps<ConfigType extends AllConfigTypes> {
  selectedVisualization: string | null
  setVisualizationConfig<ConfigType extends AllConfigTypes>(config: BuilderResult<ConfigType>): void
  setActiveTab: (tab: string) => void
  config?: ConfigType | null
}

export function VisualizationBuilder<ConfigType extends AllConfigTypes>({
  setVisualizationConfig,
  selectedVisualization,
  config
}: VisualizationBuilderProps<ConfigType>) {
  function handleDataSubmit<ConfigType extends AllConfigTypes>(data: BuilderResult<ConfigType>) {
    setVisualizationConfig(data)
  }

  return (
    <VisualizationBuilderContainer>
      {selectedVisualization === 'line' && (
        <LineChartBuilderController onDataSubmit={handleDataSubmit} config={config as ChartCardConfig} />
      )}
      {selectedVisualization === 'bullet' && <BulletChartBuilderController onDataSubmit={handleDataSubmit} config={config as BulletCardConfig} />}
      {selectedVisualization === 'table' && <TableCardBuilderController onDataSubmit={handleDataSubmit} config={config as TableCardConfig}/>}
      {selectedVisualization === 'entitycard' && <EntityCardBuilderController onDataSubmit={handleDataSubmit} config={config as EntityCardConfig}/>}
      {selectedVisualization === 'switch' && <SwitchCardBuilderController onDataSubmit={handleDataSubmit} config={config as SwitchCardConfig}/>}
      {selectedVisualization === 'seqstates' && <SequentialStatesBuilderController onDataSubmit={handleDataSubmit} config={config as SequentialStatesCardConfig}/>}
    </VisualizationBuilderContainer>
  )
}
