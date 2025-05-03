import styled from 'styled-components'
import Logo from '../ui/Logo'
import Heading from '../ui/Heading'
// import LoginForm from '@/features/authentication/LoginForm'
import { breakpoints } from '@/styles/Breakpoints'
import { useSearchParams } from 'react-router-dom'

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
const backendCoreURL = import.meta.env.VITE_BACKEND_CORE_URL || 'https://tyrion.fit.vutbr.cz/riot/api'

function Login() {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || `${location.origin}`

  const handleOAuthLogin = () => {
    window.location.href = `${backendCoreURL}/auth/login?redirect=${encodeURIComponent(redirect)}`
  }

  return (
    <LoginLayout>
      <Logo hideLogo={false} />
      <Heading as="h1" align="center">
        Log in to your account
      </Heading>
      {/* <LoginForm /> */}
      <button
        onClick={handleOAuthLogin}
        className="flex items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-6 py-2 shadow-sm transition-colors duration-150 hover:bg-gray-100"
      >
        <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-5 w-5" />
        <span className="text-sm font-medium text-gray-700">Sign in with Google</span>
      </button>
    </LoginLayout>
  )
}

export default Login
