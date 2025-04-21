import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import styled from 'styled-components'
import { TbDotsVertical, TbEye, TbPencil, TbTrash } from 'react-icons/tb'

interface VPLProgram {
  id: string
  name: string
  data: any
  referencedValues: {
    id: string
    programID: string
    deviceId: string
    parameter: string
  }[]
  isRunning: boolean
  lastRun: string
}

interface AutomationProgramCardProps {
  program: VPLProgram
  onRun: (programId: string) => void
  onEdit?: (programId: string) => void
  onDelete?: (programId: string) => void
  onDetails?: (programId: string) => void
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--color-grey-100);
  padding: 1rem 1.2rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 6px var(--color-grey-300);
  gap: 0.8rem;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const StatusDot = styled.div<{ active: boolean }>`
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background-color: ${({ active }) => (active ? 'var(--color-green-500)' : 'var(--color-red-500)')};
`

const ProgramName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
`

const Info = styled.p`
  font-size: 0.9rem;
  color: var(--color-grey-600);
  margin: 0;
`

const IconButton = styled(Button)`
  padding: 0.3rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 1rem;
    height: 1rem;
  }
`

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
`

export default function AutomationProgramCard({
  program,
  onRun,
  onEdit,
  onDelete,
  onDetails
}: AutomationProgramCardProps) {
  const { id, name, isRunning, lastRun } = program

  return (
    <Card>
      <Header>
        <ProgramName>{name}</ProgramName>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <StatusDot active={isRunning} title={isRunning ? 'Running' : 'Stopped'} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton variant="ghost" title="More options">
                <TbDotsVertical />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDetails?.(id)}>
                <IconWrapper>
                  <TbEye /> Details
                </IconWrapper>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(id)}>
                <IconWrapper>
                  <TbPencil /> Edit
                </IconWrapper>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(id)}>
                <IconWrapper>
                  <TbTrash /> Delete
                </IconWrapper>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Header>
      <Info>Last run: {lastRun}</Info>
      <Button onClick={() => onRun(id)}>Run</Button>
    </Card>
  )
}
