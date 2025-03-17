import { breakpoints } from '@/styles/Breakpoints'
import styled from 'styled-components'

interface HeadingProps {
  as?: 'h1' | 'h2'
  align?: 'center' | 'none'
}

const Heading = styled.h1<HeadingProps>`
  font-size: ${({ as }) => (as === 'h2' ? '1.2rem' : '1.4rem')};
  text-align: ${({ align }) => (align === 'center' ? 'center' : '')};
  font-weight: 600;

  @media (min-width: ${breakpoints.md}) {
    font-size: ${({ as }) => (as === 'h2' ? '1.6rem' : '2rem')};
  }
`

export default Heading
