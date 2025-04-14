import styled from 'styled-components'
import { AllConfigTypes, BuilderResult } from '@/types/dashboard/gridItem'
import { LineChartBuilderController } from './builders/LineChartBuidlerController'
import { BulletChartBuilderController } from './builders/BulletChartBuilderController'
import { EntityCardBuilderController } from './builders/EntityCardBuilderController'
import { TableCardBuilderController } from './builders/TableCardBuilderController'

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
  function handleDataChange<ConfigType extends AllConfigTypes>(data: BuilderResult<ConfigType>) {
    setVisualizationConfig(data)
  }

  return (
    <VisualizationBuilderContainer>
      {selectedVisualization === 'line' && <LineChartBuilderController onDataSubmit={handleDataChange} />}
      {selectedVisualization === 'bullet' && <BulletChartBuilderController onDataSubmit={handleDataChange} />}
      {selectedVisualization === 'table' && <TableCardBuilderController onDataSubmit={handleDataChange} />}
      {selectedVisualization === 'entitycard' && <EntityCardBuilderController onDataSubmit={handleDataChange} />}
    </VisualizationBuilderContainer>
  )
}
