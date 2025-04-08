import styled from 'styled-components'
import { Button } from '@/components/ui/button'
import { breakpoints } from '@/styles/Breakpoints'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
`

const Card = styled.div`
  background: var(--color-grey-0);
  padding: 1rem;
  border-radius: 12px;
  width: 100%;
  box-shadow: 0px 2px 8px var(--color-grey-200);

  @media (min-width: ${breakpoints.sm}) {
    padding: 2rem;
    max-width: 1300px;
  }
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;

  @media (min-width: ${breakpoints.sm}) {
    flex-direction: row;
  }
`

const ProfileImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-grey-200);

  @media (min-width: ${breakpoints.sm}) {
    width: 100px;
    height: 100px;
  }
`

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: ${breakpoints.sm}) {
    gap: 0.25rem;
  }
`

const InfoRow = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.95rem;
  span:first-child {
    font-weight: 600;
    min-width: 100px;
    color: var(--color-grey-500);
  }
`

// Placeholder until Google user context is available
const currentUser = {
  name: 'John Doe',
  email: 'john.doe@gmail.com',
  username: 'john_doe',
  profileImageUrl: '/placeholders/avatar2.webp'
}

export default function UserAccountDetail() {
  return (
    <Container>
      <Card>
        <Header>
          <ProfileImage src={currentUser.profileImageUrl} alt={currentUser.name} />
          <InfoSection>
            <InfoRow>
              <span>Name:</span>
              <span>{currentUser.name}</span>
            </InfoRow>
            <InfoRow>
              <span>Username:</span>
              <span>{currentUser.username}</span>
            </InfoRow>
            <InfoRow>
              <span>Email:</span>
              <span>{currentUser.email}</span>
            </InfoRow>
          </InfoSection>
        </Header>

        <div className="mb-4 mt-4 text-justify text-sm text-[--color-grey-500] sm:text-left sm:text-base">
          Your account is managed via Google. To update your personal information, please use your Google Account
          settings.
        </div>

        <Button
          className="ml-auto block w-full sm:w-max"
          variant="default"
          onClick={() => window.open('https://myaccount.google.com/personal-info', '_blank')}
        >
          Manage on Google
        </Button>
      </Card>
    </Container>
  )
}
