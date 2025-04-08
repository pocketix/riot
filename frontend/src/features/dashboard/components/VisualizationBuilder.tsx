import styled from 'styled-components'
import { LineChartBuilder } from './builders/LineChartBuilder'
import { BulletChartBuilder } from './builders/BulletChartBuilder'
import { SdInstancesWithParamsQuery } from '@/generated/graphql'
import { TableCardBuilder } from './builders/TableCardBuilder'
import { EntityCardBuilder } from './builders/EntityCardBuilder'
import { AllConfigTypes, BuilderResult } from '@/types/dashboard/GridItem'

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
  instances: SdInstancesWithParamsQuery['sdInstances']
}

export function VisualizationBuilder({
  setVisualizationConfig,
  selectedVisualization,
  instances
}: VisualizationBuilderProps) {
  function handleDataChange<ConfigType extends AllConfigTypes>(data: BuilderResult<ConfigType>) {
    setVisualizationConfig(data)
  }

  return (
    <VisualizationBuilderContainer>
      {selectedVisualization === 'line' && <LineChartBuilder onDataSubmit={handleDataChange} instances={instances} />}
      {selectedVisualization === 'bullet' && <BulletChartBuilder onDataSubmit={handleDataChange} />}
      {selectedVisualization === 'table' && <TableCardBuilder onDataSubmit={handleDataChange} instances={instances} />}
      {selectedVisualization === 'entitycard' && (
        <EntityCardBuilder onDataSubmit={handleDataChange} instances={instances} />
      )}
    </VisualizationBuilderContainer>
  )
}
