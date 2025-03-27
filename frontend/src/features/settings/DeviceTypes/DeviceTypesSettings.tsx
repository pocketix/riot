import { useQuery } from '@apollo/client'
import styled from 'styled-components'
import { GET_SD_TYPES } from '@/graphql/Queries'
import { SdTypesQuery, SdTypesQueryVariables } from '@/generated/graphql'
import Spinner from '@/ui/Spinner'
import DeviceTypeCard from './DeviceTypeCard'
import Heading from '@/ui/Heading'
import { Button } from '@/components/ui/button'
import { breakpoints } from '@/styles/Breakpoints'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: ${breakpoints.sm}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`

const Grid = styled.div`
  display: grid;
  gap: 1.5rem;
  justify-content: center;
  grid-template-columns: 1fr;

  @media (min-width: ${breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
`

export default function DeviceTypesSettings() {
  const { t } = useTranslation()

  const { data, loading } = useQuery<SdTypesQuery, SdTypesQueryVariables>(GET_SD_TYPES, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first'
  })

  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  if (loading) return <Spinner />
  if (!data?.sdTypes?.length) return <p>No device types found.</p>

  const filteredDeviceTypes = data.sdTypes.filter((type) =>
    `${type.label ?? ''} ${type.denotation ?? ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Container>
      <Header>
        <Heading as="h2">
          {t('manageDeviceTypes')}{' '}
          <span style={{ fontWeight: '200', fontStyle: 'italic', textWrap: 'nowrap' }}>
            ({t('types', { count: filteredDeviceTypes.length })})
          </span>
          .
        </Heading>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <Input
            placeholder={t('searchDeviceTypesPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[--color-grey-300] sm:w-64"
          />
          <Button onClick={() => navigate('/settings/device-types/addNewType')}>+ {t('addNew')}</Button>
        </div>
      </Header>

      <Grid>
        {filteredDeviceTypes.length > 0 ? (
          filteredDeviceTypes.map((deviceType) => <DeviceTypeCard key={deviceType.id} deviceType={deviceType} />)
        ) : (
          <p className="col-span-full text-center">{t('noDeviceTypesMatch')}</p>
        )}
      </Grid>
    </Container>
  )
}
