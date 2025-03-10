import styled from 'styled-components'
import { FaList } from 'react-icons/fa'
import { SdTypesQuery } from '@/generated/graphql'
import { Button } from '@/components/ui/button'
import { getIcon } from '@/utils/getIcon'
import { TbTrash } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'

const Card = styled.div`
  background: var(--color-grey-0);
  color: -var(--color-white);
  border-radius: 8px;
  padding: 16px;
  width: 100%;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0px 2px 6px var(--color-grey-200);
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Title = styled.h3`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
`

const Icon = styled.div`
  width: 40px;
  height: 40px;
  aspect-ratio: 1/1;
  background: var(--color-grey-200);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
`

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
`

type DeviceTypeCardProps = {
  deviceType: SdTypesQuery['sdTypes'][0]
}

export default function DeviceTypeCard({ deviceType }: DeviceTypeCardProps) {
  const navigate = useNavigate()

  const { denotation, label, icon, parameters, id } = deviceType
  const IconComponent = getIcon(icon || 'TbQuestionMark')

  return (
    <Card>
      <Header>
        <Title>{label}</Title>
        <Icon>{IconComponent && <IconComponent />}</Icon>
      </Header>
      <p>Denotation: {denotation}</p>
      <Button onClick={() => navigate(`/settings/device-types/${id}`)}>View Details</Button>
      <ButtonGroup>
        <Button>
          <FaList /> View Instances
        </Button>
        <Button variant={'destructive'}>
          <TbTrash /> Delete
        </Button>
      </ButtonGroup>
    </Card>
  )
}
