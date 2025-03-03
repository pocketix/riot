import { Layout as ReactGridLayout } from 'react-grid-layout';

// Define the types for additional properties
export type VisualizationType = 'line' | 'switch' | 'entitycard';
export type ConnectedEntity = 'sensor' | 'device';
export type ConnectedAttribute = 'temperature' | 'humidity' | 'status';

// Extend the existing Layout type
export interface ExtendedLayout extends ReactGridLayout {
    visualizationType: VisualizationType;
    connectedEntity: ConnectedEntity;
    connectedAttribute: ConnectedAttribute;
}