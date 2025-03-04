import styled from 'styled-components';

export const ToolTipContainer = styled.div<{ $offsetHorizontal: number; $offsetVertical: number, $isDarkMode?: boolean }>`
    position: relative;
    left: ${(props) => props.$offsetHorizontal}px;
    right: 0;
    top: ${(props) => props.$offsetVertical}px;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;
    background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
    border-radius: 5px;
    padding: 8px;
    border: ${props => props.$isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'};
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* Corrected property */
    z-index: 1000;
    font-size: 12px;
    line-height: 16px;
`;