import styled from 'styled-components';
import GlobalStyles from '../GlobalStyles';

export const Container = styled.div`
  position: relative;
  margin: 8px;
  display: flex;
  flex-direction: column;
  align-items: start;
  box-sizing: border-box;
  margin: 0;
  width: 100%;
  height: 100%;
`;

export const DragHandle = styled.div`
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  cursor: grab;
  margin-bottom: 8px;
`;

export const ArrowContainer = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #ccc;
  z-index: 99;
  display: flex;
  flex-direction: row;
  gap: 8px;
  margin-top: 8px; // Add some spacing between the content and the arrows
`;

export const Arrow = styled.button<{ disabled?: boolean, $red?: boolean, $green?: boolean }>`
  background-color: ${props => {
    if (props.disabled) return '#ccc';
    if (props.$red) return '#FF8488';
    if (props.$green) return '#46AF89';
    return 'white';
  }};
  transition: background-color 0.3s;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: ${props => props.disabled ? '#ccc' : '#e0e0e0'};
  }
`;

export const DeleteIconContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  color: #ff0000;
  padding: 8px;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  border: 1px solid #ccc;
`;