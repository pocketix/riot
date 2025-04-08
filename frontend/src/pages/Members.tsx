import styled from 'styled-components'
import tw from 'tailwind-styled-components'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Heading from '@/ui/Heading'
import { breakpoints } from '@/styles/Breakpoints'

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 2rem;
  color: hsl(var(--color-white));
  overflow-y: auto;
  width: 100%;
  padding: 1.5rem;

  @media (min-width: ${breakpoints.sm}) {
    max-width: 1300px;
  }
`

const CardGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
`

const UserCard = styled.div`
  background: var(--color-grey-0);
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0px 2px 6px var(--color-grey-200);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
`

const ProfileImage = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: var(--color-grey-200);
  object-fit: cover;
`

const Username = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`

const Name = styled.p`
  font-size: 0.95rem;
  color: var(--color-grey-600);
  margin: 0;
`

const LastLogin = styled.p`
  font-size: 0.85rem;
  color: var(--color-grey-500);
  margin: 0;
`

const TopBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 500px;
`

const ClearButton = tw.button`
  absolute right-2 top-1/2 -translate-y-1/2
`

// Temporary mocked users
const mockedUsers = [
  {
    id: 1,
    username: 'john_doe',
    name: 'John Doe',
    profileImageUrl: '/placeholders/avatar1.webp',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
  },
  {
    id: 2,
    username: 'jane_smith',
    name: 'Jane Smith',
    profileImageUrl: '/placeholders/avatar2.webp',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 hours ago
  },
  {
    id: 3,
    username: 'tech_wizard',
    name: 'Lucas Sky',
    profileImageUrl: '/placeholders/avatar3.webp',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 30) // 30 min ago
  },
  {
    id: 4,
    username: 'data_queen',
    name: 'Elena Codes',
    profileImageUrl: '/placeholders/avatar4.webp',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
  },
  {
    id: 5,
    username: 'debug_master',
    name: 'Tom Logic',
    profileImageUrl: '/placeholders/avatar5.webp',
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 5) // 5 min ago
  }
]

export default function Members() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filteredUsers = mockedUsers.filter((user) =>
    `${user.username} ${user.name}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageWrapper>
      <Container>
        <TopBar>
          <Heading className="">{t('membersPage.title')}</Heading>
          <div className="relative w-full">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('membersPage.searchPlaceholder')}
              className="w-full bg-[--color-grey-200] pr-10"
            />
            {search && (
              <ClearButton onClick={() => setSearch('')} type="button">
                <X className="h-5 w-5 text-xl text-[--color-white]" />
              </ClearButton>
            )}
          </div>
        </TopBar>

        <CardGrid>
          {filteredUsers.map((user) => (
            <UserCard key={user.id}>
              <ProfileImage src={user.profileImageUrl || ''} alt={user.name} />
              <Username>{user.username}</Username>
              <Name>{user.name}</Name>
              <LastLogin>
                {t('membersPage.lastLogin', {
                  time: user.lastLoginAt ? formatDistanceToNow(user.lastLoginAt, { addSuffix: true }) : 'N/A'
                })}
              </LastLogin>

              <Button onClick={() => navigate(`/members/${user.id}`)}>{t('membersPage.viewDetails')}</Button>
            </UserCard>
          ))}
        </CardGrid>
      </Container>
    </PageWrapper>
  )
}
