import styled from 'styled-components'
import { FaList } from 'react-icons/fa'
import {
  DeleteSdTypeMutation,
  DeleteSdTypeMutationVariables,
  SdTypesQuery,
  SdTypesQueryVariables
} from '@/generated/graphql'
import { Button } from '@/components/ui/button'
import { getIcon } from '@/utils/getIcon'
import { TbTrash } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import { DELETE_DEVICE_TYPE } from '@/graphql/Mutations'
import { useMutation, useQuery } from '@apollo/client'
import { GET_SD_TYPES } from '@/graphql/Queries'
import DeleteConfirmationModal from '@/ui/DeleteConfirmationModal'
import { useState } from 'react'
import { breakpoints } from '@/styles/Breakpoints'
import { useMediaQuery } from 'react-responsive'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

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
  font-size: 1.2rem;
  font-weight: 600;

  @media (min-width: ${breakpoints.sm}) {
    font-size: 1.4rem;
  }
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

  @media (min-width: ${breakpoints.sm}) {
    width: 50px;
    height: 50px;
    font-size: 1.4rem;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
`

type DeviceTypeCardProps = {
  deviceType: SdTypesQuery['sdTypes'][0]
}

export default function DeviceTypeCard({ deviceType }: DeviceTypeCardProps) {
  const { t } = useTranslation()
  const isMobile = useMediaQuery({ maxWidth: parseInt(breakpoints.sm.replace('px', '')) })
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { denotation, label, icon, id } = deviceType
  const IconComponent = getIcon(icon || 'TbQuestionMark')

  const { refetch } = useQuery<SdTypesQuery, SdTypesQueryVariables>(GET_SD_TYPES)
  const [deleteSDTypeMutation] = useMutation<DeleteSdTypeMutation, DeleteSdTypeMutationVariables>(DELETE_DEVICE_TYPE)

  const handleDelete = async () => {
    if (!id) return

    try {
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
      setIsModalOpen(false)
      toast.success(t('deviceTypeDetail.deletedSuccess'))
      await refetch()
    } catch (error) {
      console.error('Deletion failed:', error)
      toast.error(t('deviceTypeDetail.deletedError'))
    }
  }

  return (
    <Card>
      <Header>
        <Title>{label}</Title>
        <Icon>{IconComponent && <IconComponent />}</Icon>
      </Header>
      <p>
        {t('denotation')}: {denotation}
      </p>
      <Button size={isMobile ? 'sm' : undefined} onClick={() => navigate(`/settings/device-types/${id}`)}>
        {t('viewDetails')}
      </Button>
      <ButtonGroup>
        <Button size={isMobile ? 'sm' : undefined}>
          <FaList /> {t('viewInstances')}
        </Button>
        <>
          <Button size={isMobile ? 'sm' : undefined} onClick={() => setIsModalOpen(true)} variant="destructive">
            <TbTrash /> {t('deleteType')}
          </Button>

          <DeleteConfirmationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleDelete}
            itemName={t('thisDeviceType')}
          />
        </>
      </ButtonGroup>
    </Card>
  )
}
