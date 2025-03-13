import styled from 'styled-components'
import { LineChartBuilder } from './builders/LineChartBuilder'
import { BulletChartBuilder } from './builders/BulletChartBuilder'
import { SdInstance, SdParameter } from '@/generated/graphql'
import { TableCardBuilder } from './builders/TableCardBuilder'
import { EntityCardBuilder } from './builders/EntityCardBuilder'
import { Button } from '@/components/ui/button'
import { FaArrowLeft } from 'react-icons/fa6'

export const VisualizationBuilderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  height: fit-content;
`

export interface VisualizationBuilderProps {
  selectedVisualization: string | null
  setVisualizationConfig: (Config: string) => void
  setActiveTab: (tab: string) => void
  instances: SdInstance[]
}

export function VisualizationBuilder({ setVisualizationConfig, setActiveTab, selectedVisualization, instances }: VisualizationBuilderProps) {
  const handleDataChange = (data: any) => {
    setVisualizationConfig(JSON.stringify(data))
  }

  return (
    <VisualizationBuilderContainer>
      {selectedVisualization === 'line' && <LineChartBuilder onDataSubmit={handleDataChange} instances={instances} />}
      {selectedVisualization === 'bullet' && <BulletChartBuilder onDataSubmit={handleDataChange} parameterName={selectedParameter.denotation} />}
      {selectedVisualization === 'table' && <TableCardBuilder onDataSubmit={handleDataChange} instances={instances} />}
      {selectedVisualization === 'entitycard' && <EntityCardBuilder onDataSubmit={handleDataChange} instances={instances} />}
      {/* <Button onClick={() => setActiveTab('visualization')} className="w-fit">
        <FaArrowLeft />
        Back
      </Button> */}
    </VisualizationBuilderContainer>
  )
}
