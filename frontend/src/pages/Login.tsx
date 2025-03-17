import styled from 'styled-components'
import Logo from '../ui/Logo'
import Heading from '../ui/Heading'
import LoginForm from '@/features/authentication/LoginForm'
import { breakpoints } from '@/styles/Breakpoints'

const LoginLayout = styled.main`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 20rem;
  align-content: center;
  justify-content: center;
  gap: 1.2rem;

  @media (min-width: ${breakpoints.sm}) {
    grid-template-columns: 28rem;
    gap: 1.8rem;
  }
`

function Login() {
  return (
    <LoginLayout>
      <Logo hideLogo={false} />
      <Heading as={'h1'} align="center">
        Log in to your account
      </Heading>
      <LoginForm />
    </LoginLayout>
  )
}

export default Login
