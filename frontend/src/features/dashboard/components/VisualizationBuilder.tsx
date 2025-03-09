import styled from 'styled-components'
import { LineChartBuilder } from './builders/LineChartBuilder'
import { BulletChartBuilder } from './builders/BulletChartBuilder'
import { SdInstance, SdParameter } from '@/generated/graphql'
import { TableCardBuilder } from './builders/TableCardBuilder'

export const VisualizationBuilderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  height: fit-content;
`

export interface VisualizationBuilderProps {
  selectedVisualization: string | null
  selectedParameter: SdParameter
  setVisualizationDetails: (details: string) => void
  data?: any
  instances: SdInstance[]
}

export function VisualizationBuilder({ setVisualizationDetails, selectedVisualization, selectedParameter, data, instances }: VisualizationBuilderProps) {
  const handleDataChange = (data: any) => {
    setVisualizationDetails(JSON.stringify(data))
  }

  return (
    <VisualizationBuilderContainer>
      {selectedVisualization === 'line' && <LineChartBuilder onDataSubmit={handleDataChange} data={data} parameterName={selectedParameter.denotation} />}
      {selectedVisualization === 'bullet' && <BulletChartBuilder onDataSubmit={handleDataChange} parameterName={selectedParameter.denotation} />}
      {selectedVisualization === 'table' && <TableCardBuilder onDataSubmit={handleDataChange} instances={instances} />}
    </VisualizationBuilderContainer>
  )
}
