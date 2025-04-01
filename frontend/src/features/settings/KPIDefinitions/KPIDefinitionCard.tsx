import { useState } from 'react'
import styled from 'styled-components'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { TbEdit, TbTrash } from 'react-icons/tb'
import { KpiDefinitionsQuery } from '@/generated/graphql'
import DeleteConfirmationModal from '@/ui/DeleteConfirmationModal'
import { breakpoints } from '@/styles/Breakpoints'
import { useTranslation } from 'react-i18next'

const Card = styled.div`
  background: var(--color-grey-0);
  color: var(--color-white);
  border-radius: 8px;
  padding: 1rem;
  width: 100%;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 2px 6px var(--color-grey-200);
  gap: 0.1rem;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Title = styled.h3`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;

  @media (min-width: ${breakpoints.sm}) {
    font-size: 1.4rem;
  }
`

const Detail = styled.p`
  margin: 4px 0;
  font-size: 1rem;
  color: var(--color-grey-600);

  @media (min-width: ${breakpoints.sm}) {
    font-size: 1rem;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
`

type KPIDefinitionCardProps = {
  kpiDefinition: KpiDefinitionsQuery['kpiDefinitions'][0]
  onDelete: (id: number) => void
}

export default function KPIDefinitionCard({ kpiDefinition, onDelete }: KPIDefinitionCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id, sdInstanceMode, sdTypeSpecification, userIdentifier } = kpiDefinition
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <Card>
      <Header>
        <Title>{userIdentifier}</Title>
      </Header>

      <Detail>
        <strong>{t('kpiDefinitionsPage.instanceMode')}:</strong> {sdInstanceMode}
      </Detail>

      <Detail>
        <strong>{t('kpiDefinitionsPage.definedForType')}:</strong> {sdTypeSpecification}
      </Detail>

      <ButtonGroup>
        <Button onClick={() => navigate(`/settings/kpi-definitions/${id}/edit`)}>
          <TbEdit /> {t('kpiDefinitionsPage.edit')}
        </Button>
        <Button variant="destructive" onClick={() => setIsModalOpen(true)}>
          <TbTrash /> {t('kpiDefinitionsPage.delete')}
        </Button>
      </ButtonGroup>

      {/* Modal Window for Confirming Deletion */}
      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          onDelete(id)
          setIsModalOpen(false)
        }}
        itemName="this KPI definition"
      />
    </Card>
  )
}
