import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const StyledPageNotFound = styled.main`
  height: 100vh;
  color: var(--color-white);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(to bottom, var(--primary-background), var(--secondary-background));
    opacity: 0.5;
    z-index: -1;
  }
`

const Message = styled.h1`
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 2rem;
`

function PageNotFound() {
  const navigate = useNavigate()

  return (
    <StyledPageNotFound>
      <Message>The page you are looking for could not be found 😢</Message>
      <Button onClick={() => navigate(-1)}>← Go back</Button>
    </StyledPageNotFound>
  )
}

export default PageNotFound
