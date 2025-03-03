// Define the types for card entities
export type VisualizationData = {
    chartType: string;
    values: number[];
};

export type SwitchData = {
    isOn: boolean;
};

export type CardType = 'visualization' | 'switch';

// Define the base card interface
export interface Card {
    id: number;
    title: string;
    type: CardType;
    data: VisualizationData | SwitchData;
    x: number; // Column position
    y: number; // Row position
  }

// Define the API response structure
export interface ApiResponse {
    cards: Card[];
}

// Define the layout structure (array of card IDs in order)
export type Layout = number[];