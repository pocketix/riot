// Adapted from: https://github.com/jonasschmedtmann/ultimate-react-course/blob/main/17-the-wild-oasis/final-6-final/src/ui/SpinnerMini.jsx
// Author: Jonas Schmedtmann

import styled, { keyframes } from 'styled-components'
import { BiLoaderAlt } from 'react-icons/bi'

const rotate = keyframes`
  to {
    transform: rotate(1turn)
  }
`

const SpinnerMini = styled(BiLoaderAlt)`
  width: 2.4rem;
  height: 2.4rem;
  animation: ${rotate} 1.5s infinite linear;
`

export default SpinnerMini
