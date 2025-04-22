import styled from 'styled-components'

export const ToolTipContainer = styled.div<{
  $offsetHorizontal: number
  $offsetVertical: number
  $isDarkMode?: boolean
}>`
  position: relative;
  left: ${(props) => props.$offsetHorizontal}px;
  top: ${(props) => props.$offsetVertical}px;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
  background-color: ${(props) => (props.$isDarkMode ? 'black' : 'white')};
  border-radius: 5px;
  padding: 8px;
  border: ${(props) => (props.$isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)')};
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  font-size: 12px;
  line-height: 16px;
  word-wrap: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
`