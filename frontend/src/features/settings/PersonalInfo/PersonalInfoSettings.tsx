import styled from 'styled-components'
import UserAccountDetail from './UserAccountDetail'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

export default function PersonalInfoSettings() {
  return <UserAccountDetail />
}
