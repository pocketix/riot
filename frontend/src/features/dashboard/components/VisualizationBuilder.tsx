import styled from 'styled-components'
import { AllConfigTypes, BuilderResult } from '@/types/dashboard/gridItem'
import { LineChartBuilderController } from './builders/LineChartBuidlerController'
import { BulletChartBuilderController } from './builders/BulletChartBuilderController'
import { EntityCardBuilderController } from './builders/EntityCardBuilderController'
import { TableCardBuilderController } from './builders/TableCardBuilderController'
import { SwitchCardBuilderController } from './builders/SwitchCardBuilderController'

export const VisualizationBuilderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  height: fit-content;
`

export interface VisualizationBuilderProps {
  selectedVisualization: string | null
  setVisualizationConfig<ConfigType extends AllConfigTypes>(config: BuilderResult<ConfigType>): void
  setActiveTab: (tab: string) => void
}

export function VisualizationBuilder({
  setVisualizationConfig,
  selectedVisualization,
}: VisualizationBuilderProps) {
  function handleDataSubmit<ConfigType extends AllConfigTypes>(data: BuilderResult<ConfigType>) {
    setVisualizationConfig(data)
  }

  return (
    <VisualizationBuilderContainer>
      {selectedVisualization === 'line' && <LineChartBuilderController onDataSubmit={handleDataSubmit} />}
      {selectedVisualization === 'bullet' && <BulletChartBuilderController onDataSubmit={handleDataSubmit} />}
      {selectedVisualization === 'table' && <TableCardBuilderController onDataSubmit={handleDataSubmit} />}
      {selectedVisualization === 'entitycard' && <EntityCardBuilderController onDataSubmit={handleDataSubmit} />}
      {selectedVisualization === 'switch' &&  <SwitchCardBuilderController onDataSubmit={handleDataSubmit} />}
    </VisualizationBuilderContainer>
  )
}
