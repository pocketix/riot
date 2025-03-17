import { useState } from 'react'
import SpinnerMini from '../../ui/SpinnerMini'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import styled from 'styled-components'
import { breakpoints } from '@/styles/Breakpoints'

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: var(--color-grey-100);
  border: 1px solid var(--color-grey-100);
  border-radius: 0.5rem;
  overflow: hidden;
  padding: 1rem;

  @media (min-width: ${breakpoints.sm}) {
    font-size: 1.4rem;
    padding: 2.5rem;
  }
`

function LoginForm() {
  const [email, setEmail] = useState('test@test.com')
  const [password, setPassword] = useState('12345678')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('Submitting form')
  }

  return (
    <StyledForm onSubmit={handleSubmit}>
      <Label htmlFor="email">Email address</Label>
      <Input type="email" id="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Label htmlFor="password">Password</Label>
      <Input type="password" id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button size={'lg'}>{false ? <SpinnerMini /> : 'Login'}</Button>
    </StyledForm>
  )
}

export default LoginForm
