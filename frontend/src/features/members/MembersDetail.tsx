import styled from 'styled-components'
import { useParams, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { breakpoints } from '@/styles/Breakpoints'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
  align-items: center;

  @media (min-width: ${breakpoints.sm}) {
    padding: 2rem;
  }
`

const Card = styled.div`
  background: var(--color-grey-0);
  padding: 2rem;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0px 2px 8px var(--color-grey-200);
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
  gap: 0.25rem;
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

const Subsection = styled.div`
  margin-top: 1.5rem;
`

const List = styled.ul`
  list-style: disc;
  padding-left: 1.5rem;
`

const mockedUsers = [
  {
    id: '1',
    username: 'john_doe',
    name: 'John Doe',
    email: 'john@example.com',
    profileImageURL: 'https://i.pravatar.cc/150?img=3',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    roles: ['Admin'],
    permissions: ['read:all', 'write:config'],
    userConfig: {
      theme: 'light',
      dashboardLayout: 'list',
      preferredLanguage: 'cz',
      shortcuts: ['cmd+enter'],
      integrations: {
        github: false,
        slack: true
      }
    }
  },
  {
    id: '2',
    username: 'alice_wonder',
    name: 'Alice Wonder',
    email: 'alice@example.com',
    profileImageURL: 'https://i.pravatar.cc/150?img=5',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    roles: ['Viewer'],
    permissions: ['read:all'],
    userConfig: {
      theme: 'light',
      language: 'fr',
      shortcuts: true
    }
  },
  {
    id: '3',
    username: 'tech_wizard',
    name: 'Lucas Sky',
    email: 'lucas@example.com',
    profileImageURL: 'https://i.pravatar.cc/150?img=10',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 30),
    roles: ['Editor'],
    permissions: ['read:all', 'edit:devices'],
    userConfig: {
      autoSave: true,
      theme: 'system',
      tools: ['inspector', 'terminal']
    }
  },
  {
    id: '4',
    username: 'greenfox',
    name: 'Anna Fox',
    email: 'anna@example.com',
    profileImageURL: 'https://i.pravatar.cc/150?img=20',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    roles: ['Viewer'],
    permissions: ['read:devices'],
    userConfig: {
      theme: 'dark',
      favoriteDevices: ['Sensor A', 'Camera 5']
    }
  },
  {
    id: '5',
    username: 'admin_max',
    name: 'Max Power',
    email: 'max@example.com',
    profileImageURL: 'https://i.pravatar.cc/150?img=33',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 15),
    roles: ['Admin'],
    permissions: ['*'],
    userConfig: {
      devMode: true,
      logging: 'verbose',
      accessLevel: 10
    }
  }
]

export default function MembersDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = mockedUsers.find((u) => u.id === id)

  if (!user) return <p className="text-red-500">User not found</p>

  return (
    <Container>
      <Card>
        <Header>
          <ProfileImage src={user.profileImageURL || ''} alt={user.username} />
          <InfoSection>
            <InfoRow>
              <span>Username:</span>
              <span>{user.username}</span>
            </InfoRow>
            <InfoRow>
              <span>Name:</span>
              <span>{user.name}</span>
            </InfoRow>
            <InfoRow>
              <span>Email:</span>
              <span>{user.email}</span>
            </InfoRow>
            <InfoRow>
              <span>Last login:</span>
              <span>{formatDistanceToNow(user.lastLoginAt, { addSuffix: true })}</span>
            </InfoRow>
          </InfoSection>
        </Header>

        <Subsection>
          <strong>Roles</strong>
          <List>
            {user.roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </List>
        </Subsection>

        <Subsection>
          <strong>Permissions</strong>
          <List>
            {user.permissions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </List>
        </Subsection>

        <Accordion type="single" collapsible className="mt-4 w-full">
          <AccordionItem value="developer">
            <AccordionTrigger>Developer 🛠️</AccordionTrigger>
            <AccordionContent>
              <pre className="overflow-auto rounded bg-[--color-grey-100] p-3 text-sm">
                {JSON.stringify(user.userConfig, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-6">
          <Button onClick={() => navigate('/members')}>&larr; Back to Members</Button>
        </div>
      </Card>
    </Container>
  )
}
