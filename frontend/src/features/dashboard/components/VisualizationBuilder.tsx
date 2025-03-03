import styled from 'styled-components';
import { LineChartBuilder } from './builders/LineChartBuilder';
import { BulletChartBuilder } from './builders/BulletChartBuilder';
import { SdParameter } from '@/generated/graphql';

export const VisualizationBuilderContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    height: fit-content;
`;

export interface VisualizationBuilderProps {
    selectedVisualization: string | null;
    selectedParameter: SdParameter;
    setVisualizationDetails: (details: string) => void;
}

export function VisualizationBuilder({ setVisualizationDetails, selectedVisualization, selectedParameter }: VisualizationBuilderProps) {
    const handleDataChange = (data: any) => {
        setVisualizationDetails(JSON.stringify(data));
        console.log('Data:', data);
    };

    return (
        <VisualizationBuilderContainer>
            {selectedVisualization === 'line' && <LineChartBuilder onDataSubmit={handleDataChange} />}
            {selectedVisualization === 'bullet' && <BulletChartBuilder onDataSubmit={handleDataChange} parameterName={selectedParameter.denotation} />}
        </VisualizationBuilderContainer>
    );
}