import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { breakpoints } from '@/styles/Breakpoints'
import Heading from '@/ui/Heading'
import { SearchIcon, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import tw from 'tailwind-styled-components'
import AutomationProgramCard from '@/features/automations/AutomationProgramCard'

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
  width: 100%;
  padding: 1.5rem;

  @media (min-width: ${breakpoints.sm}) {
    max-width: 1300px;
  }
`

const TopBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`

const Grid = styled.div`
  display: grid;
  gap: 1.5rem;
  width: 100%;
  grid-template-columns: 1fr;

  @media (min-width: ${breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${breakpoints.md}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: ${breakpoints.lg}) {
    grid-template-columns: repeat(4, 1fr);
  }
`

const ClearButton = tw.button`
  absolute right-2 top-1/2 -translate-y-1/2
`

const mockPrograms = [
  {
    id: '1',
    name: 'Morning Routine',
    data: {},
    referencedValues: [],
    isRunning: true,
    lastRun: '2024-05-01 07:00'
  },
  {
    id: '2',
    name: 'Evening Lights',
    data: {},
    referencedValues: [],
    isRunning: false,
    lastRun: '2024-05-01 20:15'
  },
  {
    id: '3',
    name: 'Evening Lights',
    data: {},
    referencedValues: [],
    isRunning: false,
    lastRun: '2024-05-01 20:15'
  },
  {
    id: '4',
    name: 'Evening Lights',
    data: {},
    referencedValues: [],
    isRunning: false,
    lastRun: '2024-05-01 20:15'
  }
]

export default function Automations() {
  const navigate = useNavigate()

  const handleRun = (programId: string) => {
    console.log('Run program with ID:', programId)
  }

  return (
    <PageWrapper>
      <Container>
        <TopBar>
          <Heading>Automations</Heading>
          <div className="flex w-full flex-row items-center justify-between">
            <div className="relative w-full max-w-[32rem]">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search programs..." className="w-full bg-[--color-grey-200] pl-9 pr-10" />
              {true && (
                <ClearButton type="button">
                  <X className="h-5 w-5 text-xl text-[--color-white]" />
                </ClearButton>
              )}
            </div>
            <Button onClick={() => navigate('/automations/editor')}>Go to Editor</Button>
          </div>
        </TopBar>

        <Grid>
          {mockPrograms.map((program) => (
            <AutomationProgramCard key={program.id} program={program} onRun={handleRun} />
          ))}
        </Grid>
      </Container>
    </PageWrapper>
  )
}
