// Adapted from: https://github.com/jonasschmedtmann/ultimate-react-course/blob/main/17-the-wild-oasis/final-6-final/src/ui/Spinner.jsx
// Author: Jonas Schmedtmann

import styled, { keyframes } from 'styled-components'

const rotate = keyframes`
  to {
    transform: rotate(1turn)
  }
`

const Spinner = styled.div`
  margin: 4.8rem auto;
  width: 4.8rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(farthest-side, var(--color-neon-1) 94%, #0000) top/10px 10px no-repeat,
    conic-gradient(#0000 30%, var(--color-neon-1));
  -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 10px), #000 0);
  animation: ${rotate} 1.5s infinite linear;
`

export default Spinner
