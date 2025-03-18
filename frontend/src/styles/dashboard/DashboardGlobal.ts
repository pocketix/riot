import styled from 'styled-components'

export const Tile = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'highlight'
})<{ width?: string; height?: string; highlight?: boolean }>`
  width: ${(props) => props.width || '100px'};
  height: ${(props) => props.height || '100px'};
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  position: relative;
  border-radius: 5px;
  z-index: ${(props) => (props.highlight ? 10 : 0)};
`

export const DashboardRoot = styled.div`
  position: relative;
  box-sizing: border-box;
  overflow-x: hidden;
  width: 100%;
  height: 100vh;
`

export const Navbar = styled.div`
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px;

  h3 {
    font-weight: 700;
    font-size: 24px;
    margin: 0;
  }
`

export const MainGrid = styled.div`
  margin-top: 60px; /* Height of the navbar */
  height: calc(max-content + 100px);
`
