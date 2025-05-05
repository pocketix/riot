import styled from 'styled-components'

export const Container = styled.div`
  position: relative;
  margin: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: start;
  box-sizing: border-box;
  margin: 0;
  width: 100%;
  height: 100%;
`

export const DragHandle = styled.div`
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  z-index: 3;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-radius: 12px;
  cursor: grab;
`

export const ArrowContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-height: 50%;
  padding: 2px;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 2;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 4px;
`

export const Arrow = styled.button<{ disabled?: boolean; $red?: boolean; $green?: boolean }>`
  background-color: ${(props) => {
    if (props.disabled) return 'hsl(var(--primary))'
    if (props.$red) return 'red'
    if (props.$green) return 'hsl(var(--chart-2))'
    return 'hsl(var(--primary))'
  }};
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  color: hsl(var(--primary-foreground));
  transition:
    background-color 0.3s,
    opacity 0.3s;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  padding: 2px 4px;
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(32px, calc(50%), 60px);
  height: clamp(32px, calc(100% / 6), 50px);

  &:hover {
    opacity: ${(props) => (props.disabled ? 0.5 : 0.8)};
  }

  svg {
    width: 100%;
    height: 100%;
    max-height: 24px;
    max-width: 24px;
  }
`

export const DeleteEditContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: row;
  gap: 10px;
  top: 0px;
  right: 0px;
  z-index: 3;
  background-color: hsl(var(--primary));
  border: 1px solid hsl(var(--border));
  padding: 6px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
`

export const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`
