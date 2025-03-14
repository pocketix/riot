import styled from 'styled-components'
import { LineChartBuilder } from './builders/LineChartBuilder'
import { BulletChartBuilder } from './builders/BulletChartBuilder'
import { SdInstance } from '@/generated/graphql'
import { TableCardBuilder } from './builders/TableCardBuilder'
import { EntityCardBuilder } from './builders/EntityCardBuilder'
import { Sizing } from '@/types/CardGeneral'

export const VisualizationBuilderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  height: fit-content;
`

export type BuilderResult = {
  config: any
  sizing?: Sizing
}

export interface VisualizationBuilderProps {
  selectedVisualization: string | null
  setVisualizationConfig: (Config: any) => void
  setActiveTab: (tab: string) => void
  instances: SdInstance[]
}

export function VisualizationBuilder({ setVisualizationConfig, selectedVisualization, instances }: VisualizationBuilderProps) {
  const handleDataChange = (data: BuilderResult) => {
    setVisualizationConfig(data)
  }

  return (
    <VisualizationBuilderContainer>
      {selectedVisualization === 'line' && <LineChartBuilder onDataSubmit={handleDataChange} instances={instances} />}
      {selectedVisualization === 'bullet' && <BulletChartBuilder onDataSubmit={handleDataChange} instances={instances} />}
      {selectedVisualization === 'table' && <TableCardBuilder onDataSubmit={handleDataChange} instances={instances} />}
      {selectedVisualization === 'entitycard' && <EntityCardBuilder onDataSubmit={handleDataChange} instances={instances} />}
      {/* <Button onClick={() => setActiveTab('visualization')} className="w-fit">
        <FaArrowLeft />
        Back
      </Button> */}
    </VisualizationBuilderContainer>
  )
}
