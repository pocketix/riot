import styled from 'styled-components'
import { FaList } from 'react-icons/fa'
import { DeleteSdTypeMutation, DeleteSdTypeMutationVariables, SdTypesQuery, SdTypesQueryVariables } from '@/generated/graphql'
import { Button } from '@/components/ui/button'
import { getIcon } from '@/utils/getIcon'
import { TbTrash } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import { DELETE_DEVICE_TYPE } from '@/graphql/Mutations'
import { useMutation, useQuery } from '@apollo/client'
import { GET_SD_TYPES } from '@/graphql/Queries'

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

  const { denotation, label, icon, id } = deviceType
  const IconComponent = getIcon(icon || 'TbQuestionMark')

  const { refetch } = useQuery<SdTypesQuery, SdTypesQueryVariables>(GET_SD_TYPES)
  const [deleteSDTypeMutation] = useMutation<DeleteSdTypeMutation, DeleteSdTypeMutationVariables>(DELETE_DEVICE_TYPE)

  const handleDelete = async () => {
    if (!id) return

    try {
      console.log('Attempting to delete device type with ID:', id)

      await deleteSDTypeMutation({
        variables: { id: Number(id) },
        update: (cache) => {
          cache.modify({
            fields: {
              sdTypes(existingSDTypes = [], { readField }) {
                return existingSDTypes.filter((sdTypeRef: any) => readField('id', sdTypeRef) !== Number(id))
              }
            }
          })
        }
      })

      console.log('Successfully deleted:', id)
      await refetch()
    } catch (error) {
      console.error('Deletion failed:', error)
    }
  }

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
        <Button onClick={handleDelete} variant={'destructive'}>
          <TbTrash /> Delete
        </Button>
      </ButtonGroup>
    </Card>
  )
}
